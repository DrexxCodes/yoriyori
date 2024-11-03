const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.orderStatusChanged = functions.firestore
    .document('orders/{orderId}')
    .onUpdate((change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        if (newValue.status !== previousValue.status) {
            const userId = newValue.userId;
            const orderId = context.params.orderId;
            const newStatus = newValue.status;

            return admin.firestore().collection('notifications').add({
                userId: userId,
                message: `Your order with ID ${orderId} has a status change. Your items are now ${newStatus}.`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        return null;
    });
