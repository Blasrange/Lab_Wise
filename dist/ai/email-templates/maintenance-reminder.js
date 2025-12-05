"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMaintenanceReminderEmail = void 0;
const generateMaintenanceReminderEmail = ({ equipment, task, recipientName, }) => {
    const language = "es"; // For now, hardcode to Spanish as per the template. Could be dynamic later.
    const translations = {
        es: {
            subject: `Recordatorio: Mantenimiento Programado - ${equipment.instrument}`,
            header: "Recordatorio: Mantenimiento Programado",
            equipmentInfo: "Información del Equipo",
            instrument: "Instrumento",
            internalCode: "Código Interno",
            brand: "Marca",
            model: "Modelo",
            serialNumber: "Número de Serie",
            systemNumber: "Número de Sistema",
            lastExtCalibration: "Última Calibración Externa",
            nextExtCalibration: "Próxima Calibración Externa",
            maintenanceDetails: "Detalles del Mantenimiento",
            type: "Tipo",
            status: "Estado",
            priority: "Prioridad",
            scheduledDate: "Fecha Programada",
            responsible: "Responsable",
            description: "Descripción",
            importantInfo: "Información importante",
            importantText: "Este es un correo automático del Sistema de Gestión de Equipos de Laboratorio. Para más detalles, ingrese al sistema o contacte al administrador.",
            footerText: "Este correo fue enviado automáticamente, por favor no responder.",
            systemName: "Sistema de Gestión de Equipos de Laboratorio",
        },
    };
    const t = translations[language];
    return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 20px; background-color: #f4f4f7; color: #333; }
        .container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }
        .header img { vertical-align: middle; margin-right: 10px; }
        .content { padding: 20px; }
        .card { border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .card-equipment { background-color: #eff6ff; border: 1px solid #dbeafe; }
        .card-maintenance { background-color: #fffbeb; border: 1px solid #fde68a; }
        .card-info { background-color: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; }
        .card-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; }
        .card-title svg { margin-right: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #4b5563; }
        .detail-value { text-align: right; color: #1f2937; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
           🗓️ ${t.header} - ${equipment.instrument}
        </div>
        <div class="content">
          <div class="card card-equipment">
            <h3 class="card-title">📄 ${t.equipmentInfo}</h3>
            <div class="detail-row"><span class="detail-label">${t.instrument}:</span> <span class="detail-value">${equipment.instrument}</span></div>
            <div class="detail-row"><span class="detail-label">${t.internalCode}:</span> <span class="detail-value">${equipment.internalCode}</span></div>
            <div class="detail-row"><span class="detail-label">${t.brand}:</span> <span class="detail-value">${equipment.brand}</span></div>
            <div class="detail-row"><span class="detail-label">${t.model}:</span> <span class="detail-value">${equipment.model}</span></div>
            <div class="detail-row"><span class="detail-label">${t.serialNumber}:</span> <span class="detail-value">${equipment.serialNumber}</span></div>
            <div class="detail-row"><span class="detail-label">${t.systemNumber}:</span> <span class="detail-value">${equipment.systemNumber}</span></div>
            <div class="detail-row"><span class="detail-label">${t.lastExtCalibration}:</span> <span class="detail-value">${equipment.lastExternalCalibration}</span></div>
            <div class="detail-row"><span class="detail-label">${t.nextExtCalibration}:</span> <span class="detail-value">${equipment.nextExternalCalibration}</span></div>
          </div>

          <div class="card card-maintenance">
            <h3 class="card-title">🔧 ${t.maintenanceDetails}</h3>
            <div class="detail-row"><span class="detail-label">${t.type}:</span> <span class="detail-value">${task.action}</span></div>
            <div class="detail-row"><span class="detail-label">${t.status}:</span> <span class="detail-value">${task.status}</span></div>
            <div class="detail-row"><span class="detail-label">${t.priority}:</span> <span class="detail-value">${task.priority || "N/A"}</span></div>
            <div class="detail-row"><span class="detail-label">${t.scheduledDate}:</span> <span class="detail-value">${task.date}</span></div>
            <div class="detail-row"><span class="detail-label">${t.responsible}:</span> <span class="detail-value">${task.responsible}</span></div>
            <div class="detail-row"><span class="detail-label">${t.description}:</span> <span class="detail-value">${task.action}</span></div>
          </div>

          <div class="card card-info">
            <h3 class="card-title">💡 ${t.importantInfo}</h3>
            <p style="font-size: 14px; margin: 0;">${t.importantText}</p>
          </div>
        </div>
        <div class="footer">
          <p>${t.systemName}</p>
          <p>${t.footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.generateMaintenanceReminderEmail = generateMaintenanceReminderEmail;
