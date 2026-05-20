// Configuración de tu aplicación web Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDR4j-k_F39OtI0XEJV_LNO8pm8Pwkp-l8",
    authDomain: "panaderia-9597c.firebaseapp.com",
    projectId: "panaderia-9597c",
    storageBucket: "panaderia-9597c.appspot.com",
    messagingSenderId: "988945752809",
    appId: "1:988945752809:web:f31fd33a3a1dfa9aac8678",
    measurementId: "G-0P8D88L6EN"
};

// Inicializar Firebase (usando la versión "Compat")
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    // Inicializar Cloud Firestore y obtener una referencia al servicio
    window.db = firebase.firestore();
    console.log("⚡ Firebase inicializado correctamente en TechParts.");
} else {
    console.error("❌ Firebase SDK no está cargado. Asegúrate de incluir los scripts de Firebase Compat.");
}
