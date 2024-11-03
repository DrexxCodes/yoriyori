document.getElementById('check-order-id').addEventListener('click', () => {
    const orderId = document.getElementById('order-id').value;
    if (!orderId) return;

    rtdb.ref('orders/' + orderId).get().then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            displayOrderDetails(data);
            document.getElementById('order-details').classList.remove('hidden');
        } else {
            alert('Order ID not found.');
            document.getElementById('order-details').classList.add('hidden');
        }
    });
});

function displayOrderDetails(data) {
    const itemsList = document.getElementById('items-list');
    const cancelQuantity = document.getElementById('cancel-quantity');
    itemsList.innerHTML = '';
    cancelQuantity.innerHTML = '<option value="">Select number of items</option>';
    let totalItems = 0;

    Object.values(data.items).forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('product');
        itemElement.innerHTML = `
            <h2>${item.name}</h2>
            <p>Status: ${data.status}</p>
            <p class="product-price">$${item.price.toFixed(2)}</p>
        `;
        itemsList.appendChild(itemElement);
        totalItems++;
    });

    for (let i = 1; i <= totalItems; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        cancelQuantity.appendChild(option);
    }

    document.getElementById('cancel-quantity-label').classList.remove('hidden');
    cancelQuantity.classList.remove('hidden');

    cancelQuantity.addEventListener('change', () => {
        const selectedQuantity = parseInt(cancelQuantity.value);
        if (selectedQuantity === totalItems) {
            document.getElementById('item-checklist').classList.add('hidden');
            document.getElementById('cancel-reason-label').classList.remove('hidden');
            document.getElementById('cancel-reason').classList.remove('hidden');
            document.getElementById('submit-cancel').classList.remove('hidden');
            validateForm();
        } else {
            document.getElementById('item-checklist').classList.remove('hidden');
            document.getElementById('cancel-reason-label').classList.remove('hidden');
            document.getElementById('cancel-reason').classList.remove('hidden');
            document.getElementById('submit-cancel').classList.add('hidden');
            populateItemChecklist(data.items);
        }
    });
}

function populateItemChecklist(items) {
    const itemOptions = document.getElementById('item-options');
    itemOptions.innerHTML = '';

    Object.values(items).forEach(item => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('item-option');
        optionElement.innerHTML = `
            <span>${item.name}</span>
            <input type="checkbox" name="items" value="${item.name}">
        `;
        itemOptions.appendChild(optionElement);
    });

    const checkboxes = itemOptions.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validateForm);
    });

    document.getElementById('cancel-reason').addEventListener('input', validateForm);
}

function validateForm() {
    const checkboxes = document.getElementById('item-options').querySelectorAll('input[type="checkbox"]:checked');
    const cancelReason = document.getElementById('cancel-reason').value.trim();
    const submitButton = document.getElementById('submit-cancel');

    if (checkboxes.length > 0 && cancelReason) {
        submitButton.classList.remove('hidden');
        submitButton.disabled = false;
    } else {
        submitButton.classList.add('hidden');
        submitButton.disabled = true;
    }
}

document.getElementById('cancel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = document.getElementById('order-id').value;
    const selectedQuantity = parseInt(document.getElementById('cancel-quantity').value);
    const checkboxes = document.getElementById('item-options').querySelectorAll('input[type="checkbox"]:checked');
    const selectedItems = Array.from(checkboxes).map(checkbox => checkbox.value);
    const cancelReason = document.getElementById('cancel-reason').value.trim();

    const cancellationData = {
        orderId,
        selectedQuantity,
        selectedItems,
        cancelReason,
        date: new Date().toISOString(),
    };

    db.collection('cancelled').add(cancellationData).then(() => {
        alert('Cancellation request submitted.');
        window.location.href = 'summary.html';
    }).catch(error => {
        console.error('Error submitting cancellation: ', error);
    });
});