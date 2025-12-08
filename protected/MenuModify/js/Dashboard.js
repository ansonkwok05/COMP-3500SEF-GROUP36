let currentItemId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadRestaurantInfo();
    loadMenuItems();

    // Setup event listeners
    document.getElementById('add-item-btn').addEventListener('click', showAddModal);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('modal-save-btn').addEventListener('click', saveMenuItem);
    document.getElementById('modal-cancel-btn').addEventListener('click', hideModal);

    // Close modal when clicking outside
    document.getElementById('item-modal').addEventListener('click', function(e) {
        if (e.target === this) hideModal();
    });
});

// Load restaurant information
async function loadRestaurantInfo() {
    try {
        const response = await fetch('/api/shopowner/restaurant');

        if (response.ok) {
            const restaurant = await response.json();

            // Format and display restaurant info
            document.getElementById('restaurant-name').textContent =
                `🏪 ${restaurant.name || 'No restaurant name'}`;
            document.getElementById('restaurant-address').textContent =
                `📍 ${restaurant.address || 'No address provided'}`;
            document.getElementById('restaurant-cuisine').textContent =
                `🍽️ ${restaurant.cuisine || 'No cuisine specified'}`;
        } else {
            console.error('Failed to load restaurant info');
        }
    } catch (error) {
        console.error('Error loading restaurant:', error);
    }
}

// Load menu items for the shop owner
async function loadMenuItems() {
    try {
        // Show loading state
        const container = document.getElementById('menu-items');
        container.innerHTML = '<div class="loading">Loading menu items...</div>';

        const response = await fetch('/api/shopowner/menu');

        if (response.ok) {
            const data = await response.json();
            renderMenuItems(data.menu_items || []);
        } else {
            throw new Error('Failed to load menu items');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('menu-items').innerHTML =
            '<div class="no-items">Error loading menu items. Please try again.</div>';
    }
}

// Render menu items in grid layout
function renderMenuItems(items) {
    const container = document.getElementById('menu-items');

    if (items.length === 0) {
        container.innerHTML = '<div class="no-items">No menu items yet. Add your first item!</div>';
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
                    <span class="quantity-label">Quantity:</span>
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

    try {
        const response = await fetch(`/api/shopowner/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantity: parseInt(quantity)
            })
        });

        if (response.ok) {
            showMessage('Quantity updated successfully!', 'success');
        } else {
            showMessage('Failed to update quantity', 'error');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showMessage('Network error. Please try again.', 'error');
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
    try {
        const response = await fetch('/api/shopowner/menu');
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
            }
        }
    } catch (error) {
        console.error('Error loading item:', error);
        showMessage('Failed to load item details', 'error');
    }
}

// Hide modal
function hideModal() {
    document.getElementById('item-modal').style.display = 'none';
}

// Save menu item (add or update)
async function saveMenuItem() {
    // Get form values
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value;
    const description = document.getElementById('item-description').value.trim();
    const quantity = document.getElementById('item-quantity').value;

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
        showMessage('Please fill in all required fields correctly', 'error');
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
        showMessage('Failed to save menu item. Please try again.', 'error');
    }
}

// Add new menu item
async function addMenuItem(name, price, description, quantity) {
    const response = await fetch('/api/shopowner/menu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            price: parseFloat(price),
            description
        })
    });

    if (response.ok) {
        // If quantity is not 0, update it
        const qty = parseInt(quantity);
        if (qty > 0) {
            const data = await response.json();
            await updateQuantity(data.id, qty);
        }

        showMessage('Menu item added successfully!', 'success');
        hideModal();
        loadMenuItems();
    } else {
        const error = await response.json();
        showMessage(`Failed to add item: ${error.error || 'Unknown error'}`, 'error');
    }
}

// Update existing menu item
async function updateMenuItem(itemId, name, price, description, quantity) {
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
        })
    });

    if (response.ok) {
        showMessage('Menu item updated successfully!', 'success');
        hideModal();
        loadMenuItems();
    } else {
        const error = await response.json();
        showMessage(`Failed to update item: ${error.error || 'Unknown error'}`, 'error');
    }
}

// Delete menu item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/shopowner/menu/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Menu item deleted successfully!', 'success');
            loadMenuItems();
        } else {
            showMessage('Failed to delete menu item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
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