fetch("/api/restaurants")
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    return res.json();
  })
  .then(json => {
    if (!json || !Array.isArray(json.restaurants)) {
      console.error("Invalid data structure:", json);
      return;  // Or handle/display an error message
    }
    json.restaurants.forEach(restaurant => {
      //console.log(`ID: ${restaurant.id}, Name: ${restaurant.name}`);
      document.createElement("a").then(a.innerHTML='<a href="menu.html?restaurant_id=' + restaurant.id + '"><div class="restaurant-item"><h2>' + restaurant.name + '</h2></div></a>');

    });
  })
  .catch(error => console.error("Error fetching data:", error));
