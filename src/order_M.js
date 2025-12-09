
const sqlite3 = require("sqlite3");
const { generate_uuid } = require("./utils");

let db;

function initialize_db(db_path) {
    db = new sqlite3.Database(db_path);
    
    // Initialize tables if they don't exist
    db.serialize(() => {
        // Check and add restaurant_id to orders table
        db.get("PRAGMA table_info(orders)", (err, row) => {
            if (err) return;
            db.all("PRAGMA table_info(orders)", (err, rows) => {
                if (err) return;
                
                const columns = rows.map(r => r.name);
                
                // Add restaurant_id if missing
                if (!columns.includes('restaurant_id')) {
                    db.run("ALTER TABLE orders ADD COLUMN restaurant_id CHAR(16)", (err) => {
                        if (err) console.error("Failed to add restaurant_id:", err);
                    });
                }
                
                // Add total_amount if missing
                if (!columns.includes('total_amount')) {
                    db.run("ALTER TABLE orders ADD COLUMN total_amount REAL DEFAULT 0", (err) => {
                        if (err) console.error("Failed to add total_amount:", err);
                    });
                }
                
                // Add notes if missing
                if (!columns.includes('notes')) {
                    db.run("ALTER TABLE orders ADD COLUMN notes TEXT", (err) => {
                        if (err) console.error("Failed to add notes:", err);
                    });
                }
            });
        });
        
        // Create order_items table
        db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id VARCHAR(50) NOT NULL,
                menu_item_id CHAR(16) NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items (m_id)
            )
        `);
    });
}

// Create a new order
async function createOrder(userId, restaurantId, cartItems, notes = "") {
    return new Promise((resolve, reject) => {
        const orderId = generate_uuid(16);

        // Start a transaction
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Calculate total amount
            let totalAmount = 0;

            // Process each cart item
            const itemPromises = cartItems.map(item => {
                return new Promise((resolveItem, rejectItem) => {
                    db.get("SELECT price FROM menu_items WHERE m_id = ?", [item.m_id], (err, menuItem) => {
                        if (err) {
                            db.run("ROLLBACK");
                            return rejectItem(err);
                        }

                        if (!menuItem) {
                            db.run("ROLLBACK");
                            return rejectItem(new Error(`Menu item ${item.m_id} not found`));
                        }

                        const subtotal = menuItem.price * item.quantity;
                        totalAmount += subtotal;

                        db.run(
                            "INSERT INTO order_items (order_id, menu_item_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
                            [orderId, item.m_id, item.quantity, subtotal],
                            (err) => err ? rejectItem(err) : resolveItem()
                        );
                    });
                });
            });

            Promise.all(itemPromises)
                .then(() => {
                    db.run(
                        "INSERT INTO orders (id, userID, restaurant_id, status, total_amount, notes) VALUES (?, ?, ?, 'pending', ?, ?)",
                        [orderId, userId, restaurantId, totalAmount, notes],
                        function(err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return reject(err);
                            }
                            db.run("COMMIT");
                            resolve({ orderId, totalAmount, message: "Order created successfully" });
                        }
                    );
                })
                .catch(err => {
                    db.run("ROLLBACK");
                    reject(err);
                });
            });
        });
}

// Get orders for a user
async function getOrdersForUser(userId) {
    return new Promise((resolve) => {
        db.all(`
            SELECT 
                o.id, 
                o.status, 
                o.total_amount, 
                o.created_at,
                o.notes,
                r.name as restaurant_name,
                r.address as restaurant_address,
                d.name as deliveryman_name
            FROM orders o
            LEFT JOIN restaurants r ON o.restaurant_id = r.r_id
            LEFT JOIN users d ON o.deliverymanID = d.id
            WHERE o.userID = ?
            ORDER BY o.created_at DESC
        `, [userId], async (err, rows) => {
            if (err) {
                console.error("Error getting user orders:", err);
                resolve([]);
            } else {
                // Get order items for each order
                const ordersWithItems = await Promise.all(
                    (rows || []).map(async (order) => {
                        const items = await getOrderItems(order.id);
                        return {...order, items};
                    })
                );
                resolve(ordersWithItems);
            }
        });
    });
}

// Get orders for a restaurant (shop owner)
async function getOrdersForRestaurant(restaurantId) {
    return new Promise((resolve) => {
        db.all(`
            SELECT 
                o.id, 
                o.status, 
                o.total_amount, 
                o.created_at,
                o.updated_at,
                o.notes,
                o.deliverymanID,
                u.name as customer_name,
                u.address as customer_address,
                d.name as deliveryman_name
            FROM orders o
            LEFT JOIN users u ON o.userID = u.id
            LEFT JOIN users d ON o.deliverymanID = d.id
            WHERE o.restaurant_id = ?
            ORDER BY 
                CASE o.status 
                    WHEN 'pending' THEN 1
                    WHEN 'accepted' THEN 2
                    WHEN 'prepared' THEN 3
                    WHEN 'delivered' THEN 4
                    WHEN 'rejected' THEN 5
                    ELSE 6
                END,
                o.created_at DESC
        `, [restaurantId], async (err, rows) => {
            if (err) {
                console.error("Error getting restaurant orders:", err);
                resolve([]);
            } else {
                // Get order items for each order
                const ordersWithItems = await Promise.all(
                    (rows || []).map(async (order) => {
                        const items = await getOrderItems(order.id);
                        return {...order, items};
                    })
                );
                resolve(ordersWithItems);
            }
        });
    });
}

// Get order items
async function getOrderItems(orderId) {
    return new Promise((resolve) => {
        db.all(`
            SELECT 
                oi.menu_item_id as m_id,
                mi.name,
                mi.price,
                oi.quantity,
                oi.subtotal
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.m_id
            WHERE oi.order_id = ?
        `, [orderId], (err, rows) => {
            if (err) {
                console.error("Error getting order items:", err);
                resolve([]);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Get a single order by ID
async function getOrderById(orderId) {
    return new Promise((resolve) => {
        db.get(`
            SELECT 
                o.*,
                u.name as customer_name,
                u.address as customer_address,
                r.name as restaurant_name,
                r.address as restaurant_address,
                d.name as deliveryman_name
            FROM orders o
            LEFT JOIN users u ON o.userID = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.r_id
            LEFT JOIN users d ON o.deliverymanID = d.id
            WHERE o.id = ?
        `, [orderId], async (err, order) => {
            if (err || !order) {
                console.error("Error getting order:", err);
                resolve(null);
            } else {
                const items = await getOrderItems(orderId);
                resolve({ ...order, items });
            }
        });
    });
}

// Update order status
async function updateOrderStatus(orderId, status, restaurantId = null) {
    return new Promise((resolve) => {
        let query = "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        let params = [status, orderId];
        
        if (restaurantId) {
            query += " AND restaurant_id = ?";
            params.push(restaurantId);
        }
        
        db.run(query, params, function(err) {
            if (err) {
                console.error("Error updating order status:", err);
                resolve(false);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

// Accept an order (shop owner)
async function acceptOrder(orderId, restaurantId) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // Check if all items have sufficient quantity
            db.all(`
                SELECT 
                    mi.m_id,
                    mi.name,
                    mi.quantity as available,
                    oi.quantity as required
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.m_id
                WHERE oi.order_id = ? AND mi.r_id = ?
            `, [orderId, restaurantId], (err, items) => {
                if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                }
                
                // Check for insufficient stock
                const insufficientItems = items.filter(item => item.available < item.required);
                
                if (insufficientItems.length > 0) {
                    db.run("ROLLBACK");
                    return reject({
                        error: "Insufficient stock",
                        items: insufficientItems.map(item => ({
                            name: item.name,
                            required: item.required,
                            available: item.available
                        }))
                    });
                }
                
                // Deduct stock
                const updatePromises = items.map(item => {
                    return new Promise((updateResolve, updateReject) => {
                        db.run(
                            "UPDATE menu_items SET quantity = quantity - ? WHERE m_id = ?",
                            [item.required, item.m_id],
                            function(err) {
                                if (err) updateReject(err);
                                else updateResolve();
                            }
                        );
                    });
                });
                
                Promise.all(updatePromises).then(() => {
                    // Update order status
                    db.run(
                        "UPDATE orders SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?",
                        [orderId, restaurantId],
                        function(err) {
                            if (err) {
                                db.run("ROLLBACK");
                                reject(err);
                            } else if (this.changes === 0) {
                                db.run("ROLLBACK");
                                reject(new Error("Order not found or not authorized"));
                            } else {
                                db.run("COMMIT");
                                resolve(true);
                            }
                        }
                    );
                }).catch(err => {
                    db.run("ROLLBACK");
                    reject(err);
                });
            });
        });
    });
}

// Reject an order (shop owner)
async function rejectOrder(orderId, restaurantId, reason = "") {
    return new Promise((resolve) => {
        db.run(
            "UPDATE orders SET status = 'rejected', notes = COALESCE(notes || ' ', '') || ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?",
            [`Rejected: ${reason}`, orderId, restaurantId],
            function(err) {
                if (err) {
                    console.error("Error rejecting order:", err);
                    resolve(false);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

// Assign order to deliveryman
async function assignOrderToDeliveryman(orderId, deliverymanId) {
    return new Promise((resolve) => {
        db.run(
            "UPDATE orders SET deliverymanID = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'prepared'",
            [deliverymanId, orderId],
            function(err) {
                if (err) {
                    console.error("Error assigning order:", err);
                    resolve(false);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

// Mark order as delivered
async function markOrderAsDelivered(orderId, deliverymanId) {
    return new Promise((resolve) => {
        db.run(
            "UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deliverymanID = ?",
            [orderId, deliverymanId],
            function(err) {
                if (err) {
                    console.error("Error marking as delivered:", err);
                    resolve(false);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

// Get available orders for deliverymen
async function getAvailableOrders() {
    return new Promise((resolve) => {
        db.all(`
            SELECT 
                o.id,
                o.total_amount,
                o.created_at,
                r.name as restaurant_name,
                r.address as restaurant_address,
                u.name as customer_name,
                u.address as customer_address
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.r_id
            JOIN users u ON o.userID = u.id
            WHERE o.status = 'prepared' AND o.deliverymanID IS NULL
            ORDER BY o.created_at
        `, [], (err, rows) => {
            if (err) {
                console.error("Error getting available orders:", err);
                resolve([]);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Get deliveryman's assigned orders
async function getDeliverymanOrders(deliverymanId) {
    return new Promise((resolve) => {
        db.all(`
            SELECT 
                o.id,
                o.status,
                o.total_amount,
                o.created_at,
                r.name as restaurant_name,
                r.address as restaurant_address,
                u.name as customer_name,
                u.address as customer_address
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.r_id
            JOIN users u ON o.userID = u.id
            WHERE o.deliverymanID = ?
            ORDER BY 
                CASE o.status 
                    WHEN 'assigned' THEN 1
                    WHEN 'picked_up' THEN 2
                    WHEN 'delivered' THEN 3
                    ELSE 4
                END,
                o.created_at
        `, [deliverymanId], async (err, rows) => {
            if (err) {
                console.error("Error getting deliveryman orders:", err);
                resolve([]);
            } else {
                // Add items to each order
                const ordersWithItems = await Promise.all(
                    (rows || []).map(async (order) => {
                        const items = await getOrderItems(order.id);
                        return { ...order, items };
                    })
                );
                resolve(ordersWithItems);
            }
        });
    });
}

// Delete order (for testing/cleanup)
async function deleteOrder(orderId, userId = null) {
    return new Promise((resolve) => {
        let query = "DELETE FROM orders WHERE id = ?";
        let params = [orderId];
        
        if (userId) {
            query += " AND userID = ?";
            params.push(userId);
        }
        
        db.run(query, params, function(err) {
            if (err) {
                console.error("Error deleting order:", err);
                resolve(false);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

// Get order statistics for dashboard
async function getOrderStatistics(restaurantId) {
    return new Promise((resolve) => {
        db.get(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_orders,
                SUM(CASE WHEN status = 'prepared' THEN 1 ELSE 0 END) as prepared_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_orders,
                SUM(total_amount) as total_revenue
            FROM orders 
            WHERE restaurant_id = ?
        `, [restaurantId], (err, stats) => {
            if (err) {
                console.error("Error getting order statistics:", err);
                resolve({
                    total_orders: 0,
                    pending_orders: 0,
                    accepted_orders: 0,
                    prepared_orders: 0,
                    delivered_orders: 0,
                    rejected_orders: 0,
                    total_revenue: 0
                });
            } else {
                resolve(stats || {
                    total_orders: 0,
                    pending_orders: 0,
                    accepted_orders: 0,
                    prepared_orders: 0,
                    delivered_orders: 0,
                    rejected_orders: 0,
                    total_revenue: 0
                });
            }
        });
    });
}

module.exports = {
    initialize_db,
    createOrder,
    getOrdersForUser,
    getOrdersForRestaurant,
    getOrderById,
    updateOrderStatus,
    acceptOrder,
    rejectOrder,
    assignOrderToDeliveryman,
    markOrderAsDelivered,
    getAvailableOrders,
    getDeliverymanOrders,
    getOrderItems,
    deleteOrder,
    getOrderStatistics
};