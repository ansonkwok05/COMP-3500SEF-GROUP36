// protected/payment/payment.js

document.addEventListener('DOMContentLoaded', function() {
    const paymentMethod = document.getElementById('paymentMethod');
    const cardSection = document.getElementById('cardSection');
    const upiSection = document.getElementById('upiSection');
    
    if (paymentMethod) {
        paymentMethod.addEventListener('change', function() {
            if (cardSection && upiSection) {
                if (this.value === 'card') {
                    cardSection.style.display = 'block';
                    upiSection.style.display = 'none';
                } else {
                    cardSection.style.display = 'none';
                    upiSection.style.display = 'block';
                }
            }
        });
    }

        const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const paymentMethod = document.getElementById('paymentMethod').value;
            let isValid = true;
            
            if (paymentMethod === 'card') {
                const cardNumber = document.getElementById('cardNumber').value;
                if (!cardNumber || cardNumber.length < 16) {
                    alert('Please enter a valid card number');
                    isValid = false;
                }
            } else {
                const upiId = document.getElementById('upiId').value;
                if (!upiId || !upiId.includes('@')) {
                    alert('Please enter a valid UPI ID');
                    isValid = false;
                }
            }
            
            if (!isValid) return;
            
            payButton.disabled = true;
            payButton.textContent = 'Processing...';
            
            setTimeout(function() {
                window.location.href = 'success.html';
            }, 1500);
        });
    }
});