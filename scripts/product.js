let productId;
let productCategory;

// On page load, fetch product details and subscribe to cart updates
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    productId = params.get('productId');

    if (productId) {
        fetchProductDetails(productId);
        retrieveComments();
    } else {
        alert('Product not found');
        window.location.href = 'index.html';
    }

    auth.onAuthStateChanged(user => {
        if (user) subscribeToCartUpdates();
    });
};

// Fetch product details from Firestore
function fetchProductDetails(productId) {
    db.collection('products').doc(productId).get()
        .then(doc => {
            if (doc.exists) {
                const product = doc.data();
                document.getElementById('product-image').src = product.image;
                document.getElementById('product-name').textContent = product.name;
                document.getElementById('product-price').textContent = `₦ ${product.price}`;
                document.getElementById('product-description').textContent = product.description;

                productCategory = product.category; // Save category to fetch related products
                fetchRelatedProducts(productCategory);
            } else {
                alert('Product not found.');
                window.location.href = 'index.html';
            }
        })
        .catch(error => console.error('Error fetching product:', error));
}

        // Fetch related products based on category
        function fetchRelatedProducts(category) {
            const relatedProductsContainer = document.getElementById('related-products-container');
            db.collection('products').where('category', '==', category).limit(5).get()
                .then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        const relatedProduct = doc.data();

                        // Exclude the current product from related products
                        if (doc.id !== productId) {
                            const productElement = document.createElement('div');
                            productElement.classList.add('related-product');
                            productElement.innerHTML = `
                                <img src="${relatedProduct.image}" alt="${relatedProduct.name}">
                                <h4>${relatedProduct.name}</h4>
                                <p>₦${relatedProduct.price}</p>
                                <button onclick="goToProductPage('${doc.id}')">View Product</button>
                            `;
                            relatedProductsContainer.appendChild(productElement);
                        }
                    });
                })
                .catch(error => console.error('Error fetching related products:', error));
        }

        // Redirect to selected related product's page
        function goToProductPage(productId) {
            window.location.href = `product.html?productId=${productId}`;
        }

// Submit a comment with username
function submitComment() {
    const user = auth.currentUser;
    const comment = document.getElementById('comment-input').value.trim();

    if (!user) {
        alert('You need to log in to leave a comment.');
        window.location.href = 'login.html';
        return;
    }

    if (comment === '') {
        alert('Comment cannot be empty.');
        return;
    }

         // Fetch the user's name from Firestore
db.collection('UserInfo').doc(user.uid).get()
    .then(userDoc => {
        if (!userDoc.exists) {
            alert('Error: User information not found.');
            return;
        }

        // Check that the document contains a valid 'UserName' field
        const username = userDoc.data().UserName;
        if (!username) {
            alert('Error: Username is missing from your profile.');
            return;
        }
            

            db.collection('products').doc(productId).collection('Comments').add({
                username,
                userId: user.uid,
                comment,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert('Comment submitted!');
                document.getElementById('comment-input').value = '';
                retrieveComments(); // Refresh comments
            }).catch(error => console.error('Error submitting comment:', error));
        }).catch(error => console.error('Error fetching user data:', error));
}

// Retrieve and display comments with usernames
function retrieveComments() {
    const commentsContainer = document.getElementById('comments-container');
    commentsContainer.innerHTML = ''; // Clear previous comments

    db.collection('products').doc(productId).collection('Comments')
        .orderBy('timestamp', 'desc')
        .get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                const {
                    username,
                    comment,
                    timestamp
                } = doc.data();

                const commentElement = document.createElement('div');
                commentElement.classList.add('comment');

                commentElement.innerHTML = `
            <strong>${username}</strong>
            <p>${comment}</p>
            <small>${new Date(timestamp.toDate()).toLocaleString()}</small>
        `;

                commentsContainer.appendChild(commentElement);
            });
        }).catch(error => console.error('Error fetching comments:', error));
}

// Add product to cart
function addToCart() {
    const user = auth.currentUser;
    if (user) {
        db.collection('carts').doc(user.uid).set({
            products: firebase.firestore.FieldValue.arrayUnion({
                productId,
                name: document.getElementById('product-name').textContent,
                image: document.getElementById('product-image').src,
                price: document.getElementById('product-price').textContent
            })
        }, {
            merge: true
        }).then(() => {
            showMessage('Product added to cart', 'fas fa-shopping-cart');
        }).catch(error => console.error('Error adding product to cart:', error));
    } else {
        window.location.href = 'login.html';
    }
}

// Save product to Firestore
function saveItem() {
    const user = auth.currentUser;
    if (user) {
        db.collection('savedItems').doc(user.uid).set({
            items: firebase.firestore.FieldValue.arrayUnion({
                productId,
                name: document.getElementById('product-name').textContent,
                image: document.getElementById('product-image').src,
                price: document.getElementById('product-price').textContent
            })
        }, {
            merge: true
        }).then(() => {
            showMessage('Product saved', 'fas fa-bookmark');
        }).catch(error => console.error('Error saving product:', error));
    } else {
        window.location.href = 'login.html';
    }
}

// Subscribe to cart updates
function subscribeToCartUpdates() {
    const user = auth.currentUser;
    if (user) {
        db.collection('carts').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const products = doc.data().products || [];
                document.getElementById('cart-count').innerText = products.length;
            }
        }, error => console.error('Error updating cart count:', error));
    }
}

// Helper function to show messages
function showMessage(message, iconClass) {
    alert(message); // Replace with a toast if needed
}