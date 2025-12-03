document.addEventListener('DOMContentLoaded', () => {
    const pathElement = window.location.pathname.split('/');
    const restaurantID = pathElement[pathElement.length - 1];

    const menuContainer = document.querySelector(".menu-item-container");
    const cartContainer = document.getElementById('cart-container');
    const cartItemsDiv = cartContainer.querySelector('.cart-items');
    const cartTotalSpan = cartContainer.querySelector('.cart-total');
    const shoppingCartBtn = document.getElementById('shopping_cart');
    const cartCloseBtn = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.querySelector('.checkout-btn');

    if (!restaurantID || restaurantID === '') {
        alert("Restaurant is not vaild!")
        return;
    }

    fetch(`/api/restaurants/menu/${restaurantID}`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(json => {
            if (!json?.menu_items || Object.keys(json.menu_items).length === 0) {
                menuContainer.innerHTML = '<p class="text-center text-gray-600 py-10">This restaurant has no menu items yet.</p>';
                return;
            }

            const items = Object.values(json.menu_items);
            menuContainer.innerHTML = '';

            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `
                    <div class="item-info">
                        <h3 class="item-title">${item.name || 'Unnamed Item'}</h3>
                        <p class="item-desc">${item.description || 'No description'}</p>
                        <div class="item-bottom">
                            <span class="item-price">$${Number(item.price || 0).toFixed(2)}</span>
                            <button class="add-btn" data-id="${item.id}">Add</button>
                        </div>
                    </div>
                    <div class="item-image">
                        <div class="image-placeholder">Plate</div>
                    </div>
                `;

                const addBtn = menuItem.querySelector('.add-btn');
                addBtn.addEventListener('click', () => addToCart(item.id, addBtn));

                menuContainer.appendChild(menuItem);
            });
        })
        .catch(() => {
            menuContainer.innerHTML = '<p class="text-center text-red-600 py-10">Failed to load menu.</p>';
        });

    async function addToCart(itemId, button) {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Adding...';

        try {
            await fetch(`/api/cart/add/${itemId}`, { method: 'POST' });

            button.textContent = 'Added!';
            button.style.backgroundColor = '#27ae60';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '#e74c3c';
                button.disabled = false;
            }, 1000);

            if (cartContainer.classList.contains('active')) {
                updateCartUI();
            }
        } catch (err) {
            alert('Failed to add item');
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async function updateCartUI() {
        try {
            const res = await fetch('/api/cart');
            if (!res.ok) throw new Error();
            const { items } = await res.json();

            cartItemsDiv.innerHTML = '';

            if (!items || items.length === 0) {
                cartItemsDiv.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
                cartTotalSpan.textContent = 'Total: $0.00';
                checkoutBtn.disabled = true;
                return;
            }

            checkoutBtn.disabled = false;
            let total = 0;

            items.forEach(item => {
                const subtotal = item.price * item.quantity;
                total += subtotal;

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$ ${item.price.toFixed(2)} × ${item.quantity}</div>
                    </div>

                    <div class="quantity-controls">
                        <button class="qty-btn minus" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                        <span class="qty-display" data-id="${item.id}">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                        <button class="remove-btn" data-id="${item.id}">Remove</button>
                    </div>
                `;
                cartItemsDiv.appendChild(div);
            });

            cartTotalSpan.textContent = `Total: $${total.toFixed(2)}`;
        } catch (err) {
            cartItemsDiv.innerHTML = '<p class="text-red-600">Failed to load cart</p>';
        }
    }

    cartItemsDiv.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.classList.contains('qty-btn')) {
            const itemId = target.dataset.id;
            const action = target.classList.contains('plus') ? '+1' : '-1';
            await changeQuantity(itemId, action);
        }

        if (target.classList.contains('remove-btn')) {
            const itemId = target.dataset.id;
            if (confirm('Remove this item from cart?')) {
                await removeFromCart(itemId);
            }
        }
    });

    async function changeQuantity(itemId, delta) {
        try {
            const qtySpan = cartItemsDiv.querySelector(`.qty-display[data-id="${itemId}"]`);
            if (!qtySpan) return;

            let currentQty = parseInt(qtySpan.textContent);
            let newQty = currentQty + parseInt(delta);

            if (newQty < 1) {
                return removeFromCart(itemId);
            }

            await fetch(`/api/cart/change/${itemId}/${newQty}`, { method: 'PUT' });
            updateCartUI();
        } catch (err) {
            alert('Failed to update quantity');
        }
    }

    async function removeFromCart(itemId) {
        try {
            await fetch(`/api/cart/remove/${itemId}`, { method: 'DELETE' });
            updateCartUI();
        } catch (err) {
            alert('Failed to remove item');
        }
    }

    function openCart() {
        cartContainer.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartUI();
    }

    function closeCart() {
        cartContainer.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    shoppingCartBtn.addEventListener('click', openCart);
    cartCloseBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && cartContainer.classList.contains('active')) closeCart();
    });

    checkoutBtn.addEventListener('click', () => {
        if (!checkoutBtn.disabled) {
            window.location.href = '/checkout';
        }
    });
});