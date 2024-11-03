 // Check if user is logged in
 auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadUserInfo(user.uid);
    }
});

function loadUserInfo(userId) {
    db.collection('UserInfo').doc(userId).get().then(doc => {
        const userInfo = doc.data();
        const currentUser = auth.currentUser;
        document.getElementById('username').value = currentUser.displayName || '';
        if (userInfo) {
            document.getElementById('phone').value = userInfo.phone || '';
            document.getElementById('address').value = userInfo.address || '';
        }
        document.getElementById('user-uid').textContent = currentUser.uid;
    });
}

// Update user info
document.getElementById('user-info-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const UserName = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    // Update Firestore
    db.collection('UserInfo').doc(user.uid).set({
        UserName,
        phone,
        address
    }).then(() => {
        // Update Firebase authentication username
        user.updateProfile({
            displayName: UserName
        }).then(() => {
            alert('User info updated successfully!');
        }).catch(error => {
            console.error('Error updating user display name: ', error);
        });
    }).catch(error => {
        console.error('Error updating user info: ', error);
    });
});

// Back to Store button
document.getElementById('back-to-store').addEventListener('click', () => {
    window.location.href = 'store.html';
});

// Logout button
document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch(error => {
        console.error('Error logging out: ', error);
    });
});