document.addEventListener('DOMContentLoaded', function() {
    // Form elements - using NEW IDs from settings.html
    const restaurantName = document.getElementById('restaurant-name');
    const restaurantAddress = document.getElementById('restaurant-address');
    const restaurantCuisine = document.getElementById('restaurant-cuisine');
    const saveButton = document.getElementById('save-settings');
    const cancelButton = document.getElementById('cancel-settings');
    const successMessage = document.getElementById('success-message');

    // Load existing restaurant data
    loadRestaurantData();

    // Save button event listener
    saveButton.addEventListener('click', async function(e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        const formData = {
            name: restaurantName.value.trim(),
            address: restaurantAddress.value.trim(),
            cuisine: restaurantCuisine.value
        };

        console.log('Saving restaurant data:', formData);

        try {
            showLoading(true);

            const response = await fetch('/api/shopowner/restaurant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include' // Important for session cookies
            });

            const result = await response.json();
            showLoading(false);

            if (response.ok) {
                showMessage('✅ Restaurant information saved successfully!', 'success');
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = result.redirect || 'Dashboard.html';
                }, 2000);
            } else {
                showMessage(`❌ ${result.error || 'Failed to save restaurant information'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showLoading(false);
            showMessage('❌ An error occurred. Please try again.', 'error');
        }
    });

    // Cancel button event listener
    cancelButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.location.href = 'Dashboard.html';
        }
    });

    async function loadRestaurantData() {
        try {
            showLoading(true);
            const response = await fetch('/api/shopowner/restaurant', {
                credentials: 'include' // Important for session cookies
            });

            console.log('Loading restaurant data, status:', response.status);

            if (response.ok) {
                const restaurant = await response.json();
                console.log('Restaurant data loaded:', restaurant);

                // Fill the form with existing data
                restaurantName.value = restaurant.name || '';
                restaurantAddress.value = restaurant.address || '';
                restaurantCuisine.value = restaurant.cuisine || '';

                showLoading(false);
            } else if (response.status === 404) {
                // Restaurant doesn't exist yet - that's fine, form will be empty
                console.log('No existing restaurant found. Creating new one.');
                showLoading(false);
            } else if (response.status === 403) {
                showMessage('❌ Access denied. Please log in as a shop owner.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 3000);
            } else {
                console.error('Failed to load restaurant data');
                showLoading(false);
                showMessage('❌ Failed to load restaurant data. Please refresh the page.', 'error');
            }
        } catch (error) {
            console.error('Error loading restaurant data:', error);
            showLoading(false);
            showMessage('❌ Network error. Please check your connection.', 'error');
        }
    }

    function validateForm() {
        let isValid = true;

        // Reset error states
        clearErrors();

        // Validate restaurant name
        if (!restaurantName.value.trim()) {
            showError(restaurantName, 'Restaurant name is required');
            isValid = false;
        }

        // Validate address
        if (!restaurantAddress.value.trim()) {
            showError(restaurantAddress, 'Address is required');
            isValid = false;
        }

        // Validate cuisine
        if (!restaurantCuisine.value) {
            showError(restaurantCuisine, 'Please select a cuisine type');
            isValid = false;
        }

        return isValid;
    }

    function showError(inputElement, message) {
        inputElement.classList.add('error');

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // Insert after the input
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
    }

    function clearErrors() {
        // Remove error class from all inputs
        document.querySelectorAll('.form-group input.error, .form-group select.error').forEach(el => {
            el.classList.remove('error');
        });

        // Remove all error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.remove();
        });
    }

    function showMessage(text, type) {
        successMessage.textContent = text;
        successMessage.style.display = 'block';

        // Set background color based on type
        if (type === 'error') {
            successMessage.style.background = '#e74c3c';
        } else {
            successMessage.style.background = '#2ecc71';
        }

        // Hide message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    function showLoading(isLoading) {
        if (isLoading) {
            saveButton.disabled = true;
            saveButton.innerHTML = '⏳ Saving...';
            cancelButton.disabled = true;
        } else {
            saveButton.disabled = false;
            saveButton.innerHTML = '💾 Save Changes';
            cancelButton.disabled = false;
        }
    }

    // Add input validation on blur
    restaurantName.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showError(this, 'Restaurant name is required');
        } else {
            clearError(this);
        }
    });

    restaurantAddress.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showError(this, 'Address is required');
        } else {
            clearError(this);
        }
    });

    restaurantCuisine.addEventListener('change', function() {
        if (!this.value) {
            showError(this, 'Please select a cuisine type');
        } else {
            clearError(this);
        }
    });

    function clearError(inputElement) {
        inputElement.classList.remove('error');
        const errorDiv = inputElement.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
});