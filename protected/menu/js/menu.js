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

            container.innerHTML = items.map(item => {
                const imageUrl = item.image && item.image.trim() !== '' 
                    ? item.image 
                    : '/images/placeholder-food.jpg';   

                return `
                    <div class="menu-item" data-id="${item.id || ''}">
                        <div class="item-info">
                            <h3 class="item-title">${escapeHtml(item.name || 'Unnamed Item')}</h3>
                            <p class="item-desc">${escapeHtml(item.description || 'No description')}</p>
                            <div class="item-bottom">
                                <span class="item-price">$${Number(item.price || 0).toFixed(2)}</span>
                                <button class="add-btn" onclick="addToCart(this)">Add</button>
                            </div>
                        </div>
                        <div class="item-image">
                            <img src="${imageUrl}"
                                 alt="${escapeHtml(item.name || 'Food item')}"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                 onload="this.style.display='block';">
                            <!-- Fallback icon when image fails or is missing -->
                            <div class="image-placeholder">
                                Plate
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error(err);
            document.querySelector(".menu-item-container").innerHTML = 
                '<p class="text-center text-red-600 py-10">Failed to load menu.</p>';
        });
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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