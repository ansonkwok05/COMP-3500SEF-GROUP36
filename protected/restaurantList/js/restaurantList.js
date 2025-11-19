fetch("/api/restaurants")
  .then(res => {
    if (!res.ok) throw new Error("Network error");
    return res.json();
  })
  .then(data => {                             
    if (!data?.restaurants || data.restaurants.length === 0) {
      document.querySelector(".restaurantListContainer").innerHTML = 
        '<p class="no-data">No restaurants available</p>';
      return;
    }

    const container = document.querySelector(".restaurantListContainer");

    container.innerHTML = data.restaurants.map(r => {
      const imgUrl = r.image && r.image.trim() ? r.image : "";

      return `
        <a href="/restaurants/menu/${r.id}" class="restaurant-item">
          <div class="restaurant-card">
            <div class="restaurant-img">
              ${imgUrl ? 
                `<img src="${imgUrl}" alt="${escapeHtml(r.name)}" 
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                ''
              }
              <div class="placeholder">
                <span>Restaurant</span>
              </div>
            </div>
            <div class="restaurant-info">
              <h2>${escapeHtml(r.name)}</h2>
              <p>${escapeHtml(r.cuisine || 'Various cuisine')} • ${r.distance || 'Nearby'}</p>
            </div>
          </div>
        </a>
      `;
    }).join('');
  })
  .catch(err => {
    console.error("Fetch error:", err);
    document.querySelector(".restaurantListContainer").innerHTML = 
      '<p class="no-data">Failed to load restaurants</p>';
  });


function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


document.getElementById("logout").addEventListener("click", function (e) {
  e.preventDefault();
  fetch("/logout", { credentials: "include" })
    .then(res => {
      if (res.redirected) window.location = res.url;
      else window.location = "/login.html";
    })
    .catch(() => alert("Logout failed"));
});