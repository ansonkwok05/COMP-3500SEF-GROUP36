document.addEventListener('DOMContentLoaded', () => {
    const pathElement = window.location.pathname.split('/');
    const restaurantID = pathElement[pathElement.length - 1];

    if (restaurantID !== '') {
        fetch(`/api/restaurants/menu/${restaurantID}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then((json) => {
                console.log("API Response:", json); // Debug log
                if (!json || !json.menu_items) {
                    console.error("Invalid data structure or missing menu_items:", json);
                    document.getElementsByClassName("menu-item-container")[0].innerHTML = '<p>Error: No menu items available.</p>';
                    return;
                }

                // Convert menu_items object to an array of values
                const menuItemsArray = Object.values(json.menu_items);

                let menu_item = "";

                menuItemsArray.forEach((item) => {
                    menu_item += `<div class="menu-item">`;
                    menu_item += `<div class="menu-item-title"><h1>${item.name || 'Unnamed Item'}</h1></div>`;
                    menu_item += `<div class="menu-item-desc"><h2>${item.description || 'No description'}</h2></div>`;
                    menu_item += `<div class="menu-item-price"><h2>$${item.price || 0}</h2></div>`;
                    menu_item += `</div>`;
                });

                const container = document.getElementsByClassName("menu-item-container")[0];
                if (container) {
                    container.innerHTML = menu_item || '<p>No menu items available.</p>';
                } else {
                    console.error("Menu container not found in HTML");
                }
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                const container = document.getElementsByClassName("menu-item-container")[0];
                if (container) {
                    container.innerHTML = '<p>Error loading menu. Please try again later.</p>';
                }
            });
    } else {
        console.error("No restaurant ID found in URL");
        document.getElementsByClassName("menu-item-container")[0].innerHTML = '<p>No restaurant selected.</p>';
    }
});