const {
  addNotificationLog,
} = require("./dist/services/notificationService.js");

async function testMaintenanceCompleted() {
  await addNotificationLog({
    notificationType: "maintenance_completed",
    equipmentName: "Centrífuga 3000",
    equipmentInternalCode: "EQ-001",
    brand: "Eppendorf",
    model: "5804R",
    serialNumber: "SN123456",
    systemNumber: "SYS-789",
    recipients: ["blasrangel1995@gmail.com"],
    action: "Mantenimiento preventivo profundo",
    status: "Completado",
    priority: "alta",
    scheduledDate: "2025-11-28",
    completionDate: "2025-11-28",
    responsible: "Juan Pérez",
    description: "Se realizó limpieza y calibración.",
  });
  console.log("Correo de mantenimiento completado enviado.");
}

async function testMaintenanceReminder() {
  await addNotificationLog({
    notificationType: "maintenance_reminder",
    equipmentName: "Centrífuga 3000",
    equipmentInternalCode: "EQ-001",
    brand: "Eppendorf",
    model: "5804R",
    serialNumber: "SN123456",
    systemNumber: "SYS-789",
    recipients: ["blasrangel1995@gmail.com"],
    action: "Mantenimiento preventivo rutinario",
    status: "Programado",
    priority: "media",
    scheduledDate: "2025-12-01",
    responsible: "Juan Pérez",
    description: "Recordatorio de mantenimiento programado.",
  });
  console.log("Correo de recordatorio de mantenimiento enviado.");
}

(async () => {
  await testMaintenanceCompleted();
  await testMaintenanceReminder();
})();
