        // Initialize Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCkspIIUM-efZV11dn81hBIS5RdcjsNYYk",
            authDomain: "contactform-c4a4e.firebaseapp.com",
            databaseURL: "https://contactform-c4a4e-default-rtdb.firebaseio.com",
            projectId: "contactform-c4a4e",
            storageBucket: "contactform-c4a4e.appspot.com",
            messagingSenderId: "486536765007",
            appId: "1:486536765007:web:734d6d0b4638432087543a"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        const rtdb = firebase.database();

       