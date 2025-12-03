fetch("/api/restaurants")
  .then(res => {
    if (!res.ok) throw new Error("Network error");
    return res.json();
  })
  .then(data => {
    const container = document.querySelector(".restaurantListContainer");

    // for no data
    if (!data?.restaurants || data.restaurants.length === 0) {
      container.innerHTML = '<p class="no-data">No restaurants available</p>';
      return;
    }

    container.innerHTML = "";

    for (let i = 0; i < data.restaurants.length; i++) {
      const r = data.restaurants[i];


      const link = document.createElement("a");
      link.href = `/restaurants/menu/${r.id}`;
      link.className = "restaurant-item";


      link.innerHTML = `
        <div class="restaurant-card">
          <div class="restaurant-img">
            <div class="placeholder">
              <span>Restaurant</span>
            </div>
          </div>
          <div class="restaurant-info">
            <h2>${r.name}</h2>
            <p>${r.cuisine || 'Various cuisine'} • ${r.distance || 'Nearby'}</p>
          </div>
        </div>
      `;

      container.appendChild(link);
    }
  })
  .catch(err => {
    console.error("Fetch error:", err);
    document.querySelector(".restaurantListContainer").innerHTML =
      '<p class="no-data">Failed to load restaurants</p>';
  });

document.getElementById("logout").addEventListener("click", function (e) {
  e.preventDefault();
  fetch("/logout", { credentials: "include" })
    .then(res => {
      if (res.redirected) window.location = res.url;
      else window.location = "/login.html";
    })
    .catch(() => alert("Logout failed"));
});