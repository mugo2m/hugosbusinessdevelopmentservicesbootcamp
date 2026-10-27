// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
//const firebaseConfig = {
 // apiKey: "AIzaSyCvmPHp2kHbLQbSqW73TxS9NmSCARDqhfM",
  //authDomain: "mugoai-3c70b.firebaseapp.com",
  //projectId: "mugoai-3c70b",
 // storageBucket: "mugoai-3c70b.firebasestorage.app",
 // messagingSenderId: "1044600296070",
 // appId: "1:1044600296070:web:558fde4ad9da314f2d3707",
  //measurementId: "G-PTTHK4M8KR"
//};
//const firebaseConfig = {
  //apiKey: "AIzaSyBmXBBPsa2GecsegkljuBTgFZUTicDaxWI",
  //authDomain: "hugos-aeebf.firebaseapp.com",
  //projectId: "hugos-aeebf",
  //storageBucket: "hugos-aeebf.firebasestorage.app",
  //messagingSenderId: "170860596112",
  //appId: "1:170860596112:web:c2fed1be25b3b4017ac115",
  //measurementId: "G-JPF2L3H08N"
//};
//const firebaseConfig = {
  //apiKey: "AIzaSyCane50tLGLEOrL0Cbjsol_btpZuFb_whE",
  //authDomain: "poultryfeedformulation-fbedb.firebaseapp.com",
  //projectId: "poultryfeedformulation-fbedb",
  //storageBucket: "poultryfeedformulation-fbedb.firebasestorage.app",
  //messagingSenderId: "959526361397",
  //appId: "1:959526361397:web:924d0cd13b2031c808547c",
  //measurementId: "G-7W58XQWQ5Y"
//};
const firebaseConfig = {
  apiKey: "AIzaSyADFem25Qpt6DTRqqDEDdfAMaQUvTDVBBI",
  authDomain: "bdsw-d86ab.firebaseapp.com",
  projectId: "bdsw-d86ab",
  storageBucket: "bdsw-d86ab.firebasestorage.app",
  messagingSenderId: "7626535722",
  appId: "1:7626535722:web:2752e2cbef2c5c91afa453",
  measurementId: "G-5RRB7Q3G4H"
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);


// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);