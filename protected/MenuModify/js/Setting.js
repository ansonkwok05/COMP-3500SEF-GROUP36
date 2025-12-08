document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('restaurantForm');
    const messageDiv = document.getElementById('message');

    // Load existing restaurant data
    loadRestaurantData();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            cuisine: document.getElementById('cuisine').value
        };

        try {
            const response = await fetch('/api/shopowner/restaurant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Restaurant information saved successfully!', 'success');
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = result.redirect || '/protected/MenuModify/Dashboard.html';
                }, 2000);
            } else {
                showMessage(result.error || 'Failed to save restaurant information', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        }
    });

    async function loadRestaurantData() {
        try {
            const response = await fetch('/api/shopowner/restaurant');

            if (response.ok) {
                const restaurant = await response.json();

                // Fill the form with existing data
                document.getElementById('name').value = restaurant.name || '';
                document.getElementById('address').value = restaurant.address || '';
                document.getElementById('cuisine').value = restaurant.cuisine || '';
            } else if (response.status === 404) {
                // Restaurant doesn't exist yet - that's fine, form will be empty
                console.log('No existing restaurant found. Creating new one.');
            } else {
                console.error('Failed to load restaurant data');
            }
        } catch (error) {
            console.error('Error loading restaurant data:', error);
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});