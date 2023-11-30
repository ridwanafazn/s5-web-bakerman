// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnc35spKLJ7YiDez8NzKG-q_Pb4Wa-rUY",
  authDomain: "bakerman-mern.firebaseapp.com",
  projectId: "bakerman-mern",
  storageBucket: "bakerman-mern.appspot.com",
  messagingSenderId: "157833333909",
  appId: "1:157833333909:web:a6e89ac8806b0c33965f9c",
  measurementId: "G-SGGKESQ3CG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)