fetch('/firebase-config')
    .then(response => response.json())
    .then(config => {
        firebase.initializeApp(config);
        const db = firebase.firestore();
        const auth = firebase.auth();
        console.log('Firebase initialized');
    })
    .catch(error => {
        console.error('Error fetching Firebase config:', error);
    });
