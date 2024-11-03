    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadOrderHistory(user.uid);
        }
    });

    function loadOrderHistory(userId) {
        const orderContainer = document.getElementById('order-container');
        const noOrdersMessage = document.querySelector('.no-orders');
        rtdb.ref(`orders/${userId}`).on('value', snapshot => {
            orderContainer.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(orderSnapshot => {
                    const orderData = orderSnapshot.val();
                    const orderElement = document.createElement('div');
                    orderElement.classList.add('order');
                    orderElement.dataset.status = orderData.status;

                    let grandTotal = 0;
                    let discountedTotal = 0;
                    const itemsElement = document.createElement('div');
                    
                    Object.values(orderData.items).forEach(item => {
                        // Ensure price and discountedPrice are numbers
                        const price = parseFloat(item.price) || 0;
                        const discountedPrice = item.discountedPrice ? parseFloat(item.discountedPrice) : price;
                    
                        grandTotal += price * item.quantity;
                        discountedTotal += discountedPrice * item.quantity;
                    
                        const productElement = document.createElement('div');
                        productElement.classList.add('product');
                        productElement.innerHTML = `
                            <img src="${item.image}" alt="${item.name}" onclick="fetchReviewUrl('${item.productId}')">
                            <div>
                                <h3>${item.name}</h3>
                                <p>Quantity: ${item.quantity}</p>
                                <p>Original Price: $${price.toFixed(2)}</p>
                                ${item.discountedPrice ? `<p>Discounted Price: $${discountedPrice.toFixed(2)}</p>` : ''}
                                <p>Total: $${(discountedPrice * item.quantity).toFixed(2)}</p>
                            </div>
                        `;
                        itemsElement.appendChild(productElement);
                    });
                   
                    orderElement.innerHTML = `
                        <h2>Order ID: ${orderSnapshot.key}</h2>
                        ${itemsElement.outerHTML}
                        <p>Status: ${orderData.status}</p>
                        <p>Date Ordered: ${new Date(orderData.date).toLocaleString()}</p>
                        <p>Email: ${orderData.email}</p>
                        <p>Phone: ${orderData.phone}</p>
                        <p>Address: ${orderData.address}</p>
                        ${orderData.discountCode ? `<p>Discount Code: ${orderData.discountCode}</p>` : ''}
                        <p>Original Total: $${grandTotal.toFixed(2)}</p>
                        ${discountedTotal !== grandTotal ? `<p>Discounted Total: $${discountedTotal.toFixed(2)}</p>` : ''}
                    `;

                    // Fetch delivery date
                    rtdb.ref(`orders/${userId}/${orderSnapshot.key}/DeliveryDate`).once('value').then(deliveryDateSnapshot => {
                        const deliveryDate = deliveryDateSnapshot.val();
                        if (deliveryDate) {
                            const deliveryDateElement = document.createElement('p');
                            deliveryDateElement.textContent = `Delivery Date: ${new Date(deliveryDate).toLocaleDateString()}`;
                            orderElement.appendChild(deliveryDateElement);
                        }

                        // Cancel Button
                        const cancelButton = document.createElement('button');
                        cancelButton.textContent = 'Cancel';
                        cancelButton.classList.add('cancel-button');

                        // Check status to determine visibility of cancel button
                        if (orderData.status === 'in transit' || orderData.status === 'delivered') {
                            cancelButton.style.display = 'none'; // Hide cancel button
                        }

                        cancelButton.addEventListener('click', () => {
                            window.location.href = `cancel.html?orderId=${orderSnapshot.key}`;
                        });
                        orderElement.appendChild(cancelButton);

                        orderContainer.appendChild(orderElement);
                    });
                });

                filterOrders();
                noOrdersMessage.style.display = 'none';
            } else {
                noOrdersMessage.style.display = 'block';
            }
        });
    }

    function fetchReviewUrl(productId) {
        firestore.collection('products').doc(productId).get().then(doc => {
            if (doc.exists) {
                const productData = doc.data();
                if (productData.reviewUrl) {
                    window.open(productData.reviewUrl, '_blank');
                } else {
                    console.log('Review URL not available for this product.');
                }
            } else {
                console.log('Product not found.');
            }
        }).catch(error => {
            console.error('Error fetching review URL:', error);
        });
    }

    function filterOrders() {
        const filter = document.getElementById('status-filter').value;
        const orders = document.querySelectorAll('.order');
        let visibleOrders = 0;
        orders.forEach(order => {
            if (filter === '' || order.dataset.status === filter) {
                order.classList.remove('hidden');
                visibleOrders++;
            } else {
                order.classList.add('hidden');
            }
        });
        document.querySelector('.no-orders').style.display = visibleOrders > 0 ? 'none' : 'block';
    }

    document.getElementById('status-filter').addEventListener('change', filterOrders);

    function subscribeToCartUpdates() {
        const user = auth.currentUser;
        if (user) {
            db.collection('carts').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const products = doc.data().products || [];
                    document.getElementById('cart-count').innerText = products.length;
                }
            }, error => {
                console.error("Error updating cart count:", error);
            });
        }
    }
    
    function subscribeToNotifications() {
        const user = auth.currentUser;
        if (user) {
            db.collection('notifications').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const notifications = doc.data().notifications || [];
                    document.getElementById('notification-count').innerText = notifications.length;
                }
            }, error => {
                console.error("Error updating notifications count:", error);
            });
        }
    }