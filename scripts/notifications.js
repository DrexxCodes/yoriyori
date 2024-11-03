        // Check if user is logged in
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html';
            } else {
                // Load notifications and set up listeners
                loadNotifications(user.uid);
                listenForNewOrders(user.uid);
                listenForStatusChanges(user.uid);
            }
        });

        // Function to add a new notification
        function addNotification(userId, message) {
            const notificationsRef = rtdb.ref(`notifications/${userId}`);
            const newNotificationRef = notificationsRef.push();
            newNotificationRef.set({
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // Function to handle new order notifications
        function listenForNewOrders(userId) {
            rtdb.ref(`orders/${userId}`).on('child_added', snapshot => {
                const orderId = snapshot.key;
                const orderData = snapshot.val();

                // If this is a newly added order without a status field yet, show the placement notification
                if (!orderData.status) {
                    const message = `You have successfully placed an order with Order ID: ${orderId}.`;
                    addNotification(userId, message);
                }
            });
        }

        // Function to handle order status change notifications
        function listenForStatusChanges(userId) {
            rtdb.ref(`orders/${userId}`).on('child_changed', snapshot => {
                const orderData = snapshot.val();
                const orderId = snapshot.key;

                // Check if the status field has changed, and add notification only for status updates
                if (orderData && orderData.status) {
                    const newStatus = orderData.status;
                    const message = `Your order ID: ${orderId} has a status change. It is now ${newStatus}.`;
                    addNotification(userId, message);
                }
            });
        }

        // Real-time listener for displaying notifications
        function loadNotifications(userId) {
            const notificationsContainer = document.getElementById('notifications-container');
            rtdb.ref(`notifications/${userId}`).orderByChild('timestamp').on('value', snapshot => {
                notificationsContainer.innerHTML = '';
                let currentDate = null;
                
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    const notificationDate = new Date(notification.timestamp);
                    const dateString = notificationDate.toDateString();
                    const timeString = notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (currentDate !== dateString) {
                        currentDate = dateString;
                        const dateGroup = document.createElement('div');
                        dateGroup.classList.add('date-group');
                        dateGroup.innerHTML = `<h3>${dateString}</h3>`;
                        notificationsContainer.appendChild(dateGroup);
                    }

                    const notificationElement = document.createElement('div');
                    notificationElement.classList.add('notification');
                    notificationElement.innerHTML = `
                        <div>
                            <p>${notification.message}</p>
                            <p class="notification-time">${timeString}</p>
                        </div>
                        <button onclick="deleteNotification('${childSnapshot.key}')">Delete</button>
                    `;
                    notificationsContainer.lastElementChild.appendChild(notificationElement);
                });
            });
        }

        // Function to delete a notification
        function deleteNotification(notificationId) {
            const userId = auth.currentUser.uid;
            rtdb.ref(`notifications/${userId}/${notificationId}`).remove().then(() => {
                console.log('Notification deleted');
            }).catch(error => {
                console.error('Error deleting notification:', error);
            });
        }
        // Load notifications when the page loads
        auth.onAuthStateChanged(user => {
            if (user) {
                loadNotifications(user.uid);
            }
        });