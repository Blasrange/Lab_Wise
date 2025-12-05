import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

if (getApps().length === 0) {
  // Usa variable de entorno o ruta por defecto
  const credentialPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.cwd(), "src", "firebase", "serviceAccountKey.json");
  try {
    initializeApp({
      credential: cert(path.resolve(credentialPath)),
    });
  } catch (err) {
    throw new Error(
      `No se pudo inicializar Firebase Admin. Verifica la ruta de credenciales: ${credentialPath}\nError: ${err}`
    );
  }
}

export const adminDb = getFirestore();
