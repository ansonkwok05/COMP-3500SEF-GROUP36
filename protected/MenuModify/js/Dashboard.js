let currentItemId = null;
let orders = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');

    // Setup logout button (using class selector)
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        });
    }

    // Load initial data
    loadRestaurantInfo();
    loadMenuItems();

    // Setup tab switching if tabs exist
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });

        // Load orders if on orders tab
        if (window.location.hash === '#orders' || document.querySelector('.tab-btn[data-tab="orders"]')?.classList.contains('active')) {
            loadOrders();
        }
    } else {
        // If no tabs, just load orders
        loadOrders();
    }

    // Setup event listeners
    document.getElementById('add-item-btn').addEventListener('click', showAddModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveMenuItem);
    document.getElementById('modal-cancel-btn').addEventListener('click', hideModal);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Close modal when clicking outside
    document.getElementById('item-modal').addEventListener('click', function(e) {
        if (e.target === this) hideModal();
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
});

// Add tab switching function
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + '-tab') {
            content.classList.add('active');
        }
    });

    // Refresh data if needed
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'menu') {
        loadMenuItems();
    }
}

// Add this function to load orders for the shop owner
async function loadOrders() {
    try {
        console.log('Loading orders...');
        const response = await fetch('/api/shopowner/orders', {
            credentials: 'include'
        });

        console.log('Orders response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Orders loaded:', data.orders?.length || 0, 'orders');
            orders = data.orders || [];
            renderOrders();
        } else if (response.status === 404) {
            console.log('No orders found');
            renderOrders([]);
        } else {
            throw new Error(`Failed to load orders: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-container').innerHTML =
            '<div class="no-items">❌ Error loading orders. Please try again.</div>';
    }
}

// Add function to render orders
function renderOrders() {
    const container = document.getElementById('orders-container');

    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="no-items">📝 No pending orders yet.</div>';
        return;
    }

    const ordersHTML = orders.map(order => `
        <div class="order-card" data-id="${order.id}">
            <div class="order-header">
                <h3>Order #${order.id.substring(0, 8)}</h3>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            
            <div class="order-details">
                <div class="order-info">
                    <p><strong>Customer:</strong> ${escapeHtml(order.customer_name || 'Unknown')}</p>
                    <p><strong>Address:</strong> ${escapeHtml(order.customer_address || 'N/A')}</p>
                    <p><strong>Total:</strong> $${parseFloat(order.total_amount || 0).toFixed(2)}</p>
                    <p><strong>Placed:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
                
                <div class="order-items">
                    <h4>Items:</h4>
                    <ul>
                        ${(order.items || []).map(item => `
                            <li>${escapeHtml(item.name)} x ${item.quantity} - $${parseFloat(item.price * item.quantity).toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="order-notes">
                    <p><strong>Notes:</strong> ${escapeHtml(order.notes || 'No special instructions')}</p>
                </div>
            </div>
            
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="accept-btn" onclick="acceptOrder('${order.id}')">✅ Accept Order</button>
                    <button class="reject-btn" onclick="rejectOrder('${order.id}')">❌ Reject Order</button>
                ` : order.status === 'accepted' ? `
                    <button class="prepare-btn" onclick="markAsPrepared('${order.id}')">👨‍🍳 Mark as Prepared</button>
                ` : order.status === 'prepared' ? `
                    <span class="status-label">Ready for pickup</span>
                ` : order.status === 'rejected' ? `
                    <span class="status-label rejected">Order Rejected</span>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = ordersHTML;
}

// Add function to accept an order
async function acceptOrder(orderId) {
    if (!confirm('Are you sure you want to accept this order?')) {
        return;
    }

    try {
        const response = await fetch(`/api/shopowner/orders/${orderId}/accept`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showMessage('✅ Order accepted successfully!', 'success');
            loadOrders();
        } else {
            const error = await response.json();
            showMessage(`❌ Failed to accept order: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error accepting order:', error);
        showMessage('❌ Network error. Please try again.', 'error');
    }
}

// Add function to reject an order
async function rejectOrder(orderId) {
    const reason = prompt('Please enter a reason for rejecting this order:');
    if (reason === null) return; // User cancelled

    if (!reason.trim()) {
        showMessage('Please provide a reason for rejection.', 'error');
        return;
    }

    if (!confirm('Are you sure you want to reject this order?')) {
        return;
    }

    try {
        const response = await fetch(`/api/shopowner/orders/${orderId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason }),
            credentials: 'include'
        });

        if (response.ok) {
            showMessage('✅ Order rejected successfully!', 'success');
            loadOrders();
        } else {
            const error = await response.json();
            showMessage(`❌ Failed to reject order: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error rejecting order:', error);
        showMessage('❌ Network error. Please try again.', 'error');
    }
}

// Add function to mark order as prepared
async function markAsPrepared(orderId) {
    try {
        const response = await fetch(`/api/shopowner/orders/${orderId}/prepare`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showMessage('✅ Order marked as prepared!', 'success');
            loadOrders();
        } else {
            const error = await response.json();
            showMessage(`❌ Failed to update order: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error marking order as prepared:', error);
        showMessage('❌ Network error. Please try again.', 'error');
    }
}

// Add auto-refresh for orders every 30 seconds
setInterval(() => {
    if (document.querySelector('.tab-btn[data-tab="orders"].active')) {
        loadOrders();
    }
}, 30000);

// Load restaurant information
async function loadRestaurantInfo() {
    try {
        console.log('Loading restaurant info...');
        const response = await fetch('/api/shopowner/restaurant', {
            credentials: 'include' // IMPORTANT: Send session cookies
        });

        if (response.ok) {
            const restaurant = await response.json();
            console.log('Restaurant data loaded:', restaurant);

            // Format and display restaurant info
            document.getElementById('restaurant-name').textContent =
                `🏪 ${restaurant.name || 'No restaurant name'}`;
            document.getElementById('restaurant-address').textContent =
                `📍 ${restaurant.address || 'No address provided'}`;
            document.getElementById('restaurant-cuisine').textContent =
                `🍽️ ${restaurant.cuisine || 'No cuisine specified'}`;
        } else if (response.status === 404) {
            console.warn('No restaurant found for this shop owner');
            document.getElementById('restaurant-name').textContent = '🏪 No restaurant setup yet';
            document.getElementById('restaurant-address').textContent = '📍 Please set up your restaurant in Settings';
            document.getElementById('restaurant-cuisine').textContent = '🍽️ Visit Settings to get started';
        } else if (response.status === 403) {
            console.error('Access denied - not a shop owner');
            showMessage('Access denied. Please log in as a shop owner.', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);
        } else {
            console.error('Failed to load restaurant info:', response.status);
        }
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showMessage('Network error loading restaurant info', 'error');
    }
}

// Load menu items for the shop owner
async function loadMenuItems() {
    try {
        // Show loading state
        const container = document.getElementById('menu-items');
        container.innerHTML = '<div class="loading">Loading menu items...</div>';

        console.log('Loading menu items...');
        const response = await fetch('/api/shopowner/menu', {
            credentials: 'include' // IMPORTANT: Send session cookies
        });

        console.log('Menu response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Menu items loaded:', data.menu_items?.length || 0, 'items');
            renderMenuItems(data.menu_items || []);
        } else if (response.status === 404) {
            console.log('No menu items found');
            renderMenuItems([]);
        } else if (response.status === 403) {
            showMessage('Access denied. Please log in as a shop owner.', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);
        } else {
            throw new Error(`Failed to load menu items: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        document.getElementById('menu-items').innerHTML =
            '<div class="no-items">❌ Error loading menu items. Please try again.</div>';
    }
}

// Render menu items in grid layout
function renderMenuItems(items) {
    const container = document.getElementById('menu-items');

    if (items.length === 0) {
        container.innerHTML = '<div class="no-items">📝 No menu items yet. Click "Add New Item" to get started!</div>';
        return;
    }

    const itemsHTML = items.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div class="item-image"></div>
            <div class="item-info">
                <h3 class="item-title">${escapeHtml(item.name)}</h3>
                <p class="item-desc">${escapeHtml(item.description || 'No description provided')}</p>
                <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
                
                <div class="quantity-controls">
                    <span class="quantity-label">Quantity in Stock:</span>
                    <input type="number" 
                           class="quantity-input" 
                           value="${item.quantity || 0}" 
                           min="0"
                           onchange="updateQuantity('${item.id}', this.value)"
                           onblur="validateQuantityInput(this)">
                </div>
                
                <div class="item-controls">
                    <button class="save-btn" onclick="editItem('${item.id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteItem('${item.id}')">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = itemsHTML;
}

// Update quantity of a menu item
async function updateQuantity(itemId, quantity) {
    if (isNaN(quantity) || quantity < 0) {
        showMessage('Please enter a valid quantity (0 or higher)', 'error');
        return;
    }

    console.log('Updating quantity for item', itemId, 'to', quantity);

    try {
        const response = await fetch(`/api/shopowner/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantity: parseInt(quantity)
            }),
            credentials: 'include' // IMPORTANT: Send session cookies
        });

        console.log('Quantity update response:', response.status);

        if (response.ok) {
            showMessage('✅ Quantity updated successfully!', 'success');
            // Reload menu items to get fresh data
            setTimeout(loadMenuItems, 500);
        } else {
            const error = await response.json();
            showMessage(`❌ Failed to update quantity: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showMessage('❌ Network error. Please try again.', 'error');
    }
}

// Validate quantity input field
function validateQuantityInput(input) {
    const value = parseInt(input.value);
    if (isNaN(value) || value < 0) {
        input.classList.add('error');
        input.value = 0;
        showMessage('Quantity must be 0 or higher', 'error');
    } else {
        input.classList.remove('error');
        input.value = value; // Ensure integer value
    }
}

// Show add item modal
function showAddModal() {
    currentItemId = null;
    document.getElementById('modal-title').textContent = '➕ Add New Menu Item';

    // Reset form
    const form = document.getElementById('item-modal');
    form.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });

    // Set default quantity to 0
    document.getElementById('item-quantity').value = '0';

    // Show modal
    document.getElementById('item-modal').style.display = 'flex';
    document.getElementById('item-name').focus();
}

// Edit existing menu item
async function editItem(itemId) {
    console.log('Editing item:', itemId);

    try {
        const response = await fetch('/api/shopowner/menu', {
            credentials: 'include' // IMPORTANT: Send session cookies
        });

        console.log('Edit fetch response:', response.status);

        if (response.ok) {
            const data = await response.json();
            const item = data.menu_items.find(i => i.id === itemId);

            if (item) {
                currentItemId = itemId;
                document.getElementById('modal-title').textContent = '✏️ Edit Menu Item';

                // Fill form with item data
                document.getElementById('item-name').value = item.name;
                document.getElementById('item-price').value = item.price;
                document.getElementById('item-description').value = item.description || '';
                document.getElementById('item-quantity').value = item.quantity || 0;

                // Clear any error states
                document.querySelectorAll('#item-modal input, #item-modal textarea').forEach(input => {
                    input.classList.remove('error');
                });

                // Show modal
                document.getElementById('item-modal').style.display = 'flex';
                document.getElementById('item-name').focus();
            } else {
                showMessage('Item not found', 'error');
            }
        } else {
            showMessage('Failed to load item details', 'error');
        }
    } catch (error) {
        console.error('Error loading item:', error);
        showMessage('❌ Failed to load item details', 'error');
    }
}

// Hide modal
function hideModal() {
    document.getElementById('item-modal').style.display = 'none';
    currentItemId = null;
}

// Save menu item (add or update)
async function saveMenuItem() {
    // Get form values
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value;
    const description = document.getElementById('item-description').value.trim();
    const quantity = document.getElementById('item-quantity').value;

    console.log('Saving item:', { name, price, description, quantity, currentItemId });

    // Validate inputs
    let isValid = true;

    // Name validation
    if (!name) {
        document.getElementById('item-name').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('item-name').classList.remove('error');
    }

    // Price validation
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
        document.getElementById('item-price').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('item-price').classList.remove('error');
    }

    // Quantity validation
    if (isNaN(quantity) || parseInt(quantity) < 0) {
        document.getElementById('item-quantity').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('item-quantity').classList.remove('error');
    }

    if (!isValid) {
        showMessage('❌ Please fill in all required fields correctly', 'error');
        return;
    }

    try {
        if (currentItemId) {
            // Update existing item
            await updateMenuItem(currentItemId, name, price, description, quantity);
        } else {
            // Add new item
            await addMenuItem(name, price, description, quantity);
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showMessage('❌ Failed to save menu item. Please try again.', 'error');
    }
}

// Add new menu item
async function addMenuItem(name, price, description, quantity) {
    console.log('Adding new menu item...');

    const response = await fetch('/api/shopowner/menu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            price: parseFloat(price),
            description
        }),
        credentials: 'include' // IMPORTANT: Send session cookies
    });

    console.log('Add item response:', response.status);

    if (response.ok) {
        const data = await response.json();
        console.log('Item added with ID:', data.id);

        // If quantity is not 0, update it
        const qty = parseInt(quantity);
        if (qty > 0) {
            console.log('Updating quantity for new item...');
            await updateQuantity(data.id, qty);
        }

        showMessage('✅ Menu item added successfully!', 'success');
        hideModal();
        loadMenuItems();
    } else {
        const error = await response.json();
        console.error('Add item failed:', error);
        showMessage(`❌ Failed to add item: ${error.error || 'Unknown error'}`, 'error');
    }
}

// Update existing menu item
async function updateMenuItem(itemId, name, price, description, quantity) {
    console.log('Updating menu item:', itemId);

    const response = await fetch(`/api/shopowner/menu/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            price: parseFloat(price),
            description,
            quantity: parseInt(quantity)
        }),
        credentials: 'include' // IMPORTANT: Send session cookies
    });

    console.log('Update item response:', response.status);

    if (response.ok) {
        showMessage('✅ Menu item updated successfully!', 'success');
        hideModal();
        loadMenuItems();
    } else {
        const error = await response.json();
        console.error('Update item failed:', error);
        showMessage(`❌ Failed to update item: ${error.error || 'Unknown error'}`, 'error');
    }
}

// Delete menu item
async function deleteItem(itemId) {
    if (!confirm('⚠️ Are you sure you want to delete this menu item? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/shopowner/menu/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showMessage('✅ Menu item deleted successfully!', 'success');
            loadMenuItems();
        } else {
            const error = await response.json();
            showMessage(`❌ Failed to delete: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showMessage('❌ Network error. Please try again.', 'error');
    }
}

// Show message notification
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;

    if (type === 'error') {
        messageDiv.style.background = '#e74c3c';
    } else if (type === 'success') {
        messageDiv.style.background = '#2ecc71';
    }

    // Add to page
    document.body.appendChild(messageDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}