let currentTotal = 0;
let discountApplied = false;
let discountCode = '';
let discountPercentage = 0;

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadUserInfo(user.uid);
        loadCart(user.uid);
    }

});

function loadUserInfo(userId) {
    db.collection('UserInfo').doc(userId).get().then(doc => {
        const userInfo = doc.data();
        document.getElementById('email').value = auth.currentUser.email;
        if (userInfo) {
            document.getElementById('phone').value = userInfo.phone || '';
            document.getElementById('address').value = userInfo.address || '';
        }
    });
}

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

function loadCart(userId) {
    const orderedItems = document.getElementById('ordered-items');
    const totalPriceElement = document.getElementById('total-price');
    db.collection('carts').doc(userId).get().then(doc => {
        const data = doc.data();
        let total = 0;
        if (data && data.products) {
            data.products.forEach(product => {
                const productElement = document.createElement('div');
                productElement.classList.add('product');
                productElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-details">
                        <h2>${product.name}</h2>
                        <p class="product-price" id="price-${product.productId}">$${(product.price * (product.quantity || 1)).toFixed(2)}</p>
                        <div class="quantity-container">
                            <label for="quantity-${product.productId}">Quantity:</label>
                            <select id="quantity-${product.productId}" name="quantity-${product.productId}" onchange="updateQuantity('${product.productId}', this.value, ${product.price})">
                                ${[...Array(10).keys()].map(i => `<option value="${i+1}" ${product.quantity === i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;
                orderedItems.appendChild(productElement);
                total += product.price * (product.quantity || 1);
            });
            currentTotal = total;
            totalPriceElement.innerHTML = `<span>Total: $${total.toFixed(2)}</span>`;
        }
    });
}

function updateQuantity(productId, newQuantity, price) {
    const user = auth.currentUser;
    if (user) {
        db.collection('carts').doc(user.uid).get().then(doc => {
            const cartData = doc.data();
            if (cartData && cartData.products) {
                const productIndex = cartData.products.findIndex(p => p.productId === productId);
                if (productIndex !== -1) {
                    cartData.products[productIndex].quantity = parseInt(newQuantity);
                    db.collection('carts').doc(user.uid).set(cartData).then(() => {
                        document.getElementById(`price-${productId}`).textContent = `$${(price * newQuantity).toFixed(2)}`;
                        updateTotalPrice(cartData.products);
                    }).catch(error => {
                        console.error('Error updating quantity: ', error);
                    });
                }
            }
        });
    }
}

function updateTotalPrice(products) {
    let total = 0;
    products.forEach(product => {
        total += product.price * (product.quantity || 1);
    });
    currentTotal = total;
    if (discountApplied) {
        applyDiscount(false);  // Reapply discount if already applied
    } else {
        document.getElementById('total-price').innerHTML = `<span>Total: $${total.toFixed(2)}</span>`;
    }
}

function applyDiscount(showAlert = true) {
    discountCode = document.getElementById('discount-code').value;
    if (discountCode) {
        db.collection('discounts').where('code', '==', discountCode).get().then(querySnapshot => {
            if (!querySnapshot.empty) {
                const discountDoc = querySnapshot.docs[0];
                const discountData = discountDoc.data();
                discountPercentage = discountData.percentage;

                // Apply discount
                const discountedTotal = currentTotal - (currentTotal * (discountPercentage / 100));
                const totalPriceElement = document.getElementById('total-price');
                totalPriceElement.innerHTML = `<span style="text-decoration: line-through;">Total: $${currentTotal.toFixed(2)}</span> <span>New Total: $${discountedTotal.toFixed(2)}</span>`;
                currentTotal = discountedTotal;

                // Store discount code before deletion
                discountApplied = true;

                if (showAlert) {
                    alert('Discount applied successfully!');
                }
            } else {
                if (showAlert) {
                    alert('Invalid discount code');
                }
            }
        }).catch(error => {
            console.error('Error applying discount: ', error);
        });
    }
}

function getDeliveryDate(orderDate) {
    const date = new Date(orderDate);
    let workingDays = 0;
    while (workingDays < 7) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {  // Exclude weekends
            workingDays++;
        }
    }
    return date.toISOString().split('T')[0];
}

// Place order
document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const email = user.email;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const additionalNotes = document.getElementById('additional-notes').value;

    db.collection('carts').doc(user.uid).get().then(doc => {
        const cartData = doc.data();
        if (cartData && cartData.products) {
            const orderId = rtdb.ref().child('orders/' + user.uid).push().key;
            const orderItems = cartData.products.map(product => {
                return {
                    ...product,
                    quantity: product.quantity || 1
                };
            });

            const orderData = {
                userId: user.uid,
                email,
                phone,
                address,
                date: new Date().toISOString(),
                status: "processing",
                items: orderItems,
                additionalNotes: additionalNotes,
                totalPrice: currentTotal.toFixed(2),
                discountCode: discountCode || null
            };

            rtdb.ref('orders/' + user.uid + '/' + orderId).set(orderData).then(() => {
                if (discountCode) {
                    db.collection('discounts').where('code', '==', discountCode).get().then(querySnapshot => {
                        if (!querySnapshot.empty) {
                            const discountDoc = querySnapshot.docs[0];
                            discountDoc.ref.delete().then(() => {
                                console.log('Discount code deleted from Firestore');
                            }).catch(error => {
                                console.error('Error deleting discount: ', error);
                            });
                        }
                    }).catch(error => {
                        console.error('Error finding discount code for deletion: ', error);
                    });
                }

                // Remove cart items from Firestore
                db.collection('carts').doc(user.uid).delete().then(() => {
                    const orderDate = new Date();
                    const deliveryDate = getDeliveryDate(orderDate);
                    rtdb.ref('orders/' + user.uid + '/' + orderId + '/DeliveryDate').set(deliveryDate).then(() => {
                        window.location.href = `summary.html?orderId=${orderId}`;
                    }).catch(error => {
                        console.error('Error setting delivery date: ', error);
                    });
                }).catch(error => {
                    console.error('Error clearing cart: ', error);
                });
            }).catch(error => {
                console.error('Error placing order: ', error);
            });
        }
    });
});


