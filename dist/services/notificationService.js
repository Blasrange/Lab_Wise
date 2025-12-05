"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationLogs = getNotificationLogs;
exports.addNotificationLog = addNotificationLog;
const emailService_1 = require("./emailService");
const maintenance_completed_1 = require("../ai/email-templates/maintenance-completed");
const maintenance_reminder_1 = require("../ai/email-templates/maintenance-reminder");
const date_fns_1 = require("date-fns");
const config_1 = require("../firebase/config");
const firestore_1 = require("firebase/firestore");
async function getNotificationLogs() {
    const app = (0, config_1.getFirebaseApp)();
    const db = (0, firestore_1.getFirestore)(app);
    const logsCollection = (0, firestore_1.collection)(db, "notification-logs");
    const q = (0, firestore_1.query)(logsCollection, (0, firestore_1.orderBy)("sentAt", "desc"));
    const querySnapshot = await (0, firestore_1.getDocs)(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
        logs.push(Object.assign({ id: doc.id }, doc.data()));
    });
    return logs;
}
async function addNotificationLog(logData) {
    const app = (0, config_1.getFirebaseApp)();
    const db = (0, firestore_1.getFirestore)(app);
    const now = new Date();
    const newLogData = Object.assign(Object.assign({}, logData), { createdAt: (0, date_fns_1.format)(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), sentAt: (0, date_fns_1.format)(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") });
    // Enviar correo automático
    if (newLogData.recipients && newLogData.recipients.length > 0) {
        let subject = newLogData.subject || "LabWise Notification";
        let html = "";
        // Aquí deberías obtener el objeto equipment y task reales
        // Para ejemplo, se usan los datos del log
        const equipment = {
            id: newLogData.equipmentId || "0",
            instrument: newLogData.equipmentName || "Equipo",
            internalCode: newLogData.equipmentInternalCode || "",
            brand: newLogData.brand || "",
            model: newLogData.model || "",
            serialNumber: newLogData.serialNumber || "",
            systemNumber: newLogData.systemNumber || "",
            lastExternalCalibration: newLogData.lastExternalCalibration || "",
            nextExternalCalibration: newLogData.nextExternalCalibration || "",
            externalCalibrationPeriodicity: newLogData.externalCalibrationPeriodicity || "",
            internalCheckPeriodicity: newLogData.internalCheckPeriodicity || "",
            status: newLogData.equipmentStatus || "Operational",
            imageUrl: newLogData.imageUrl || "",
            imageHint: newLogData.imageHint || "",
        };
        const task = {
            id: newLogData.taskId || "0",
            equipmentId: newLogData.equipmentId || "0",
            date: newLogData.completionDate || "",
            scheduledDate: newLogData.scheduledDate || "",
            action: newLogData.action || "",
            maintenanceType: newLogData.maintenanceType || "Preventivo",
            status: newLogData.status || "Programado",
            responsible: newLogData.responsible || "",
            user: newLogData.user || "Sistema",
            priority: newLogData.priority || "media",
            description: newLogData.description || "",
        };
        const recipientName = "Usuario";
        if (newLogData.notificationType === "maintenance_completed") {
            html = (0, maintenance_completed_1.generateMaintenanceCompletedEmail)({
                equipment,
                task,
                recipientName,
            });
            subject = `Mantenimiento COMPLETADO - ${equipment.instrument}`;
        }
        else if (newLogData.notificationType === "maintenance_reminder") {
            html = (0, maintenance_reminder_1.generateMaintenanceReminderEmail)({
                equipment,
                task,
                recipientName,
            });
            subject = `Recordatorio: Mantenimiento Programado - ${equipment.instrument}`;
        }
        else {
            html = `<p>${newLogData.subject || "Notificación de LabWise"}</p>`;
        }
        const emailData = {
            to: newLogData.recipients.join(","),
            subject,
            html,
        };
        await (0, emailService_1.sendMail)(emailData);
    }
    const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db, "notification-logs"), newLogData);
    return Object.assign({ id: docRef.id }, newLogData);
}
