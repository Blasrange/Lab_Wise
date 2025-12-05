"use strict";
/**
 * @fileoverview Firebase Admin SDK configuration.
 *
 * This file is used to configure the Firebase Admin SDK. It is used by the
 * a Next.js server, and is not exposed to the client.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseConfig = void 0;
exports.getFirebaseApp = getFirebaseApp;
const app_1 = require("firebase/app");
const firebaseConfig = {
    apiKey: "AIzaSyANvJQVrjVaDdKNWT_28osbO5VDeVILOto",
    authDomain: "studio-1918952834-e1362.firebaseapp.com",
    projectId: "studio-1918952834-e1362",
    storageBucket: "studio-1918952834-e1362.appspot.com",
    messagingSenderId: "864396981774",
    appId: "1:864396981774:web:055dcdb143777568f52e5f",
};
exports.firebaseConfig = firebaseConfig;
function getFirebaseApp() {
    if ((0, app_1.getApps)().length > 0) {
        return (0, app_1.getApps)()[0];
    }
    return (0, app_1.initializeApp)(firebaseConfig);
}
