// El envío de correos se realiza ahora vía la API /api/send-email
import { generateMaintenanceCompletedEmail } from "../ai/email-templates/maintenance-completed";
import { generateMaintenanceReminderEmail } from "../ai/email-templates/maintenance-reminder";
import { format } from "date-fns";
import { getFirebaseApp } from "../firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

// El tipo NotificationLog se omite para compatibilidad CommonJS
interface NotificationLog {
  id?: string;
  notificationType?: string;
  equipmentName?: string;
  equipmentInternalCode?: string;
  subject?: string;
  recipients?: string[];
  createdAt?: string;
  sentAt?: string;
  emailResult?: {
    status?: "Sent" | "Failed";
    error?: string | null;
  } | null;
  [key: string]: any;
}

async function getNotificationLogs() {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const logsCollection = collection(db, "notification-logs");
  const q = query(logsCollection, orderBy("sentAt", "desc"));
  const querySnapshot = await getDocs(q);

  const logs: NotificationLog[] = [];
  querySnapshot.forEach((doc: any) => {
    logs.push({ id: doc.id, ...doc.data() } as NotificationLog);
  });
  return logs;
}

interface EmailData {
  to: string[];
  subject: string;
  text: string;
}

interface NotificationLogInput {
  notificationType?: string;
  equipmentName?: string;
  equipmentInternalCode?: string;
  subject?: string;
  recipients?: string[];
  [key: string]: any;
}

async function addNotificationLog(
  logData: NotificationLogInput
): Promise<NotificationLog> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const now: Date = new Date();

  let emailStatus: "Sent" | "Failed" | undefined = undefined;
  let emailError: string | undefined = undefined;

  const newLogData: NotificationLog = {
    ...logData,
    createdAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    sentAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  };

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
      externalCalibrationPeriodicity:
        newLogData.externalCalibrationPeriodicity || "",
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
      html = generateMaintenanceCompletedEmail({
        equipment,
        task,
        recipientName,
      });
      subject = `Mantenimiento COMPLETADO - ${equipment.instrument}`;
    } else if (newLogData.notificationType === "maintenance_reminder") {
      html = generateMaintenanceReminderEmail({
        equipment,
        task,
        recipientName,
      });
      subject = `Recordatorio: Mantenimiento Programado - ${equipment.instrument}`;
    } else {
      html = `<p>${newLogData.subject || "Notificación de LabWise"}</p>`;
    }
    const emailData = {
      to: newLogData.recipients.join(","),
      subject,
      html,
    };
    // Enviar correo usando la API y capturar estado
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });
      const result = await response.json();
      if (result.success) {
        emailStatus = "Sent";
      } else {
        emailStatus = "Failed";
        emailError = result.error || "Unknown error";
      }
    } catch (err: any) {
      emailStatus = "Failed";
      emailError = err?.message || "Unknown error";
    }
  }
  // Guardar el resultado del envío de correo en emailResult
  if (emailStatus || emailError) {
    newLogData.emailResult = {
      status: emailStatus,
      error: emailError ?? null,
    };
  } else {
    newLogData.emailResult = null;
  }
  const docRef = await addDoc(collection(db, "notification-logs"), newLogData);
  return { id: docRef.id, ...newLogData };
}

export { getNotificationLogs, addNotificationLog };
