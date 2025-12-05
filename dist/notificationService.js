const { sendMail: emailServiceSendMail } = require("./emailService");
const { format } = require("date-fns");
const { getFirebaseApp } = require("../../firebase/config");
const { getFirestore, collection, getDocs, addDoc, query, orderBy, } = require("firebase/firestore");
async function getNotificationLogs() {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const logsCollection = collection(db, "notification-logs");
    const q = query(logsCollection, orderBy("sentAt", "desc"));
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
        logs.push(Object.assign({ id: doc.id }, doc.data()));
    });
    return logs;
}
async function addNotificationLog(logData) {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const now = new Date();
    const newLogData = Object.assign(Object.assign({}, logData), { createdAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), sentAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") });
    // Enviar correo automático
    if (newLogData.recipients && newLogData.recipients.length > 0) {
        let mailText = "You have a new notification in LabWise.";
        switch (newLogData.notificationType) {
            case "Maintenance":
                mailText = `Maintenance scheduled for equipment: ${newLogData.equipmentName} (Code: ${newLogData.equipmentInternalCode}).`;
                break;
            case "Calibration":
                mailText = `Calibration due for equipment: ${newLogData.equipmentName} (Code: ${newLogData.equipmentInternalCode}).`;
                break;
            case "Status Change":
                mailText = `Status changed for equipment: ${newLogData.equipmentName} (Code: ${newLogData.equipmentInternalCode}).`;
                break;
            case "AI Suggestion":
                mailText = `AI suggestion for equipment: ${newLogData.equipmentName} (Code: ${newLogData.equipmentInternalCode}).`;
                break;
            default:
                mailText = newLogData.subject || mailText;
        }
        const emailData = {
            to: newLogData.recipients,
            subject: newLogData.subject || "LabWise Notification",
            text: mailText,
        };
        await emailServiceSendMail(emailData);
    }
    const docRef = await addDoc(collection(db, "notification-logs"), newLogData);
    return Object.assign({ id: docRef.id }, newLogData);
}
module.exports = { getNotificationLogs, addNotificationLog };
