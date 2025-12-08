document.addEventListener('DOMContentLoaded', function() {
    loadRestaurantInfo();

    // Event listeners
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/logout';
    });
});

async function loadRestaurantInfo() {
    try {
        const response = await fetch('/api/shopowner/restaurant');
        if (response.ok) {
            const restaurant = await response.json();
            document.getElementById('restaurant-name').value = restaurant.name || '';
            document.getElementById('restaurant-address').value = restaurant.address || '';
            document.getElementById('cuisine-type').value = restaurant.cuisine || '';
        }
    } catch (error) {
        console.error('Error loading restaurant:', error);
    }
}

async function saveSettings() {
    const name = document.getElementById('restaurant-name').value.trim();
    const address = document.getElementById('restaurant-address').value.trim();
    const cuisine = document.getElementById('cuisine-type').value;

    // Basic validation
    if (!name || !address || !cuisine) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/shopowner/restaurant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, address, cuisine })
        });

        if (response.ok) {
            alert('Restaurant information saved!');
            window.location.href = 'Dashboard.html';
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'Failed to save'));
        }
    } catch (error) {
        console.error('Error saving:', error);
        alert('Network error. Please try again.');
    }
}