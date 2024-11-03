 // Check if user is logged in
 auth.onAuthStateChanged(user => {
     if (!user) {
         window.location.href = 'login.html';
     } else {
         fetchProducts();
         subscribeToCartUpdates();
         subscribeToNotifications();
     }
 });

 function fetchProducts() {
     const productsContainer = document.getElementById('products-container');
     db.collection('products').get()
        .then(querySnapshot => {
         productsContainer.innerHTML = ''; // Clear previous products
         querySnapshot.forEach(doc => {
             const product = doc.data();
             const productId = doc.id;
             const productElement = document.createElement('div');
             productElement.classList.add('product');
             productElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p><strong>₦ ${product.price}</strong></p>
                <button class="action-button" onclick="addToCart('${doc.id}', '${product.name}', '${product.image}', ${product.price})">
                    <i></i>Add to Cart
                </button>
                        <button class="action-button" 
                        onclick="window.location.href='product.html?productId=${productId}'">
                        View Product
                    </button>
                <button class="save-button" onclick="saveItem('${doc.id}', '${product.name}', '${product.image}', ${product.price})">
                    <i class="fas fa-bookmark"></i>
                </button>
            `;
             productsContainer.appendChild(productElement);
         });
     }).catch(error => {
         console.error("Error fetching products:", error);
     });
 }

 // Check if the product is saved and update the bookmark icon
 function checkSavedProduct(userId, productId) {
     db.collection('users').doc(userId).collection('savedProducts').doc(productId)
         .get()
         .then(doc => {
             const bookmarkIcon = document.getElementById(`bookmark-${productId}`);
             if (doc.exists) {
                 bookmarkIcon.classList.add('saved'); // Add active style (e.g., filled icon)
                 bookmarkIcon.style.color = 'gold';
             } else {
                 bookmarkIcon.classList.remove('saved'); // Default inactive style
                 bookmarkIcon.style.color = 'black';
             }
         })
         .catch(error => {
             console.error("Error checking saved product:", error);
         });
 }

 // Toggle the bookmark state (save/remove product)
 function toggleBookmark(productId) {
     const user = auth.currentUser;
     if (!user) {
         alert("You need to log in to save products.");
         return;
     }

     const userId = user.uid;
     const productRef = db.collection('users').doc(userId).collection('savedProducts').doc(productId);

     productRef.get().then(doc => {
         if (doc.exists) {
             // Product is already saved, so remove it
             productRef.delete()
                 .then(() => {
                     alert("Product removed from saved items.");
                     document.getElementById(`bookmark-${productId}`).style.color = 'black';
                 })
                 .catch(error => {
                     console.error("Error removing saved product:", error);
                 });
         } else {
             // Product is not saved, so save it
             productRef.set({
                     savedAt: firebase.firestore.FieldValue.serverTimestamp()
                 })
                 .then(() => {
                     alert("Product saved!");
                     document.getElementById(`bookmark-${productId}`).style.color = 'gold';
                 })
                 .catch(error => {
                     console.error("Error saving product:", error);
                 });
         }
     }).catch(error => {
         console.error("Error toggling bookmark:", error);
     });
 }


 function searchProducts() {
     const searchInput = document.getElementById('search-input').value.toLowerCase();
     const categoryFilter = document.getElementById('category-filter').value;
     const productsContainer = document.getElementById('products-container');
     db.collection('products').get().then(querySnapshot => {
         productsContainer.innerHTML = ''; // Clear previous products
         querySnapshot.forEach(doc => {
             const product = doc.data();
             if ((product.name.toLowerCase().includes(searchInput) || product.description.toLowerCase().includes(searchInput)) &&
                 (categoryFilter === "" || product.category === categoryFilter)) {
                 const productElement = document.createElement('div');
                 productElement.classList.add('product');
                 productElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <h2>${product.name}</h2>
                    <p><strong>₦ ${product.price}</strong></p>
                    <button class="action-button" onclick="addToCart('${doc.id}', '${product.name}', '${product.image}', ${product.price})">
                        <i></i>Add to Cart
                    </button>
                     <button class="action-button" onclick="window.location.href='product.html?productId=${doc.id}'">
                        View Product
                    </button>
                    <button class="save-button" onclick="saveItem('${doc.id}', '${product.name}', '${product.image}', ${product.price})">
                        <i class="fas fa-bookmark"></i>
                    </button>
                `;
                 productsContainer.appendChild(productElement);
             }
         });
     }).catch(error => {
         console.error("Error searching products:", error);
     });
 }

 function addToCart(productId, name, image, price) {
     const user = auth.currentUser;
     if (user) {
         db.collection('carts').doc(user.uid).set({
             products: firebase.firestore.FieldValue.arrayUnion({
                 productId,
                 name,
                 image,
                 price
             })
         }, {
             merge: true
         }).then(() => {
             alert("Product added to cart successfully!");
             console.log("Product added to cart:", {
                 productId,
                 name,
                 image,
                 price
             });
         }).catch(error => {
             console.error("Error adding product to cart:", error);
         });
     } else {
         window.location.href = 'login.html';
     }
 }

 function saveItem(productId, name, image, price) {
     const user = auth.currentUser;
     if (user) {
         db.collection('savedItems').doc(user.uid).set({
             items: firebase.firestore.FieldValue.arrayUnion({
                 productId,
                 name,
                 image,
                 price
             })
         }, {
             merge: true
         }).then(() => {
             alert("Item saved successfully!");
             console.log("Item saved:", {
                 productId,
                 name,
                 image,
                 price
             });
         }).catch(error => {
             console.error("Error saving item:", error);
         });
     } else {
         window.location.href = 'login.html';
     }
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

function showMessage(message, iconClass) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<i class="${iconClass}"></i> ${message}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}