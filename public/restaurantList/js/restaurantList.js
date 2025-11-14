fetch("/api/restaurants")
    .then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then((json) => {
        if (!json || !Array.isArray(json.restaurants)) {
            console.error("Invalid data structure:", json);
            return; // Or handle/display an error message
        }

        let r_list = "";

        json.restaurants.forEach((restaurant) => {
            r_list += `<a href="/restaurants/menu/${restaurant.id}">`;
            r_list += `<div class="restaurant-item"><h2>${restaurant.name}</h2></div>`;
            r_list += `</a>`;
        });

        document.getElementsByClassName(
            "restaurantListContainer"
        )[0].innerHTML = r_list;
    })
    .catch((error) => console.error("Error fetching data:", error));
