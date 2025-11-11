// hardcoded restaurant data implemented with a js object
// this data is created for testing only
// todo: change this to a more acceptable way (using a database)
let restaurant_data = {
    1: {
        name: "McDonald's",
        address: "12 Street",
        cuisine: "Fast-food",
        rating: 3.4,
        menu_items: {
            1: {
                name: "Big Mac",
                price: 46,
                description: "Burger with patty",
            },
            2: {
                name: "McChicken",
                price: 35,
                description: "Burger with crispy chicken",
            },
        },
    },
    2: {
        name: "KFC",
        address: "345 Street",
        cuisine: "Fast-food",
        rating: 3.5,
        menu_items: {
            1: {
                name: "Chicken Bucket",
                price: 138,
                description: "6 pieces of crispy chicken",
            },
            2: {
                name: "Chicken Tenders",
                price: 82,
                description: "Chicken strips coated in seasoning",
            },
        },
    },
    3: {
        name: "Pizza Hut",
        address: "67 Street",
        cuisine: "Italian",
        rating: 3.6,
        menu_items: {
            1: {
                name: "Pepperoni Supreme Pizza",
                price: 199,
                description: "Big pepperoni pizza",
            },
        },
    },
    4: {
        name: "Saizeria",
        address: "89 Street",
        cuisine: "Italian",
        rating: 3.7,
        menu_items: {
            1: {
                name: "Pineapple & Bacon Pizza",
                price: 58,
                description: "Pizza with pineapple and bacon toppings",
            },
        },
    },
};

function check_restaurant_exists(restaurant_id) {
    if (restaurant_id in restaurant_data) return true;
    return false;
}

function get_restaurant_list() {
    let r_list = [];

    for (r_id in restaurant_data) {
        r_list.push({
            id: r_id,
            name: restaurant_data[r_id].name,
        });
    }

    return r_list;
}

function get_menu(restaurant_id) {
    // return empty array if restaurant is not found
    if (!check_restaurant_exists(restaurant_id)) return false;

    return restaurant_data[restaurant_id];
}

function update_menu_item(restaurant_id, menu_item_id, new_menu_item) {
    // todo, will be used by admins
    return true;
}

module.exports = {get_restaurant_list, get_menu};
