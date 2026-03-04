import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  
  apiKey: "AIzaSyAFvR5OKhAlxfVkkZyb42TryKivtua6EsE",

  authDomain: "lumivite-caa28.firebaseapp.com",

  projectId: "lumivite-caa28",

  storageBucket: "lumivite-caa28.firebasestorage.app",

  messagingSenderId: "237520857766",

  appId: "1:237520857766:web:106610975b8efb2bf7a267"

};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)