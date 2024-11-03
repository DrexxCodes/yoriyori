   // Add product to Firestore
   document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const price = parseFloat(document.getElementById('price').value);  // Convert to number
    const description = document.getElementById('description').value;
    const image = document.getElementById('image').value;
    const category = document.getElementById('category').value;
    const reviewUrl = document.getElementById('reviewUrl').value;

    if (isNaN(price)) {
        alert('Please enter a valid price.');
        return;
    }

    db.collection('products').add({
        name,
        price,
        description,
        image,
        category,
        reviewUrl
    }).then(() => {
        alert('Product added successfully!');
        document.getElementById('add-product-form').reset();
    }).catch(error => {
        console.error('Error adding product: ', error);
    });
});

// Add discount to Firestore
document.getElementById('add-discount-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('discount-code').value;
    const percentage = document.getElementById('discount-percentage').value;

    db.collection('discounts').add({
        code,
        percentage
    }).then(() => {
        alert('Discount added successfully!');
        document.getElementById('add-discount-form').reset();
    }).catch(error => {
        console.error('Error adding discount: ', error);
    });
});

// Fetch and modify product
function fetchProduct() {
    const productId = document.getElementById('productId').value;
    db.collection('products').doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            document.getElementById('modify-name').value = product.name;
            document.getElementById('modify-price').value = product.price;            document.getElementById('modify-description').value = product.description;
            document.getElementById('modify-image').value = product.image;
            document.getElementById('modify-category').value = product.category;
            document.getElementById('modify-reviewUrl').value = product.reviewUrl;
            document.getElementById('modify-product-container').style.display = 'block';

            document.getElementById('modify-product-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('modify-name').value;
                const price = document.getElementById('modify-price').value;
                const description = document.getElementById('modify-description').value;
                const image = document.getElementById('modify-image').value;
                const category = document.getElementById('modify-category').value;
                const reviewUrl = document.getElementById('modify-reviewUrl').value;

                db.collection('products').doc(productId).update({
                    name,
                    price,
                    description,
                    image,
                    category,
                    reviewUrl
                }).then(() => {
                    alert('Product modified successfully!');
                    document.getElementById('modify-product-container').style.display = 'none';
                    document.getElementById('fetch-product-form').reset();
                }).catch(error => {
                    console.error('Error modifying product: ', error);
                });
            });
        } else {
            alert('No product found with this ID.');
        }
    }).catch(error => {
        console.error('Error fetching product: ', error);
    });
}