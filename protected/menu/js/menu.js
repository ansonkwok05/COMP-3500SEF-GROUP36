document.addEventListener('DOMContentLoaded', () => {
    const pathElement = window.location.pathname.split('/');
    const restaurantID = pathElement[pathElement.length - 1];

    if (!restaurantID || restaurantID === '') {
        document.querySelector(".menu-item-container").innerHTML =
            '<p class="text-center text-gray-600 py-10">No restaurant selected.</p>';
        return;
    }

    fetch(`/api/restaurants/menu/${restaurantID}`)
        .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.json();
        })
        .then(json => {
            if (!json?.menu_items || Object.keys(json.menu_items).length === 0) {
                document.querySelector(".menu-item-container").innerHTML =
                    '<p class="text-center text-gray-600 py-10">This restaurant has no menu items yet.</p>';
                return;
            }

            const items = Object.values(json.menu_items);
            const container = document.querySelector(".menu-item-container");
            container.innerHTML = '';

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.dataset.id = item.id || '';

                menuItem.innerHTML = `
                    <div class="item-info">
                        <h3 class="item-title">${item.name || 'Unnamed Item'}</h3>
                        <p class="item-desc">${item.description || 'No description'}</p>
                        <div class="item-bottom">
                            <span class="item-price">$${Number(item.price || 0).toFixed(2)}</span>
                            <button class="add-btn" onclick="addToCart(this)">Add</button>
                        </div>
                    </div>
                    <div class="item-image">
                        <div class="image-placeholder">
                            Plate
                        </div>
                    </div>
                `;

                container.appendChild(menuItem);
            }
        })
        .catch(err => {
            console.error(err);
            document.querySelector(".menu-item-container").innerHTML =
                '<p class="text-center text-red-600 py-10">Failed to load menu.</p>';
        });
});

function addToCart(button) {
    const item = button.closest('.menu-item');
    const title = item.querySelector('.item-title').textContent;
    const price = item.querySelector('.item-price').textContent;

    button.textContent = 'Added';
    button.style.backgroundColor = '#27ae60';
    button.disabled = true;

    console.log('Added to cart:', { title, price });

    setTimeout(() => {
        button.textContent = 'Add';
        button.style.backgroundColor = '#e74c3c';
        button.disabled = false;
    }, 1500);
}