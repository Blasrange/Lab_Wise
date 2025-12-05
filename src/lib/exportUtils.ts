import * as XLSX from "xlsx";
import type { Equipment, NotificationLog, EquipmentHistory } from "./types";

type AssignedTask = EquipmentHistory & {
  equipmentName: string;
  equipmentModel: string;
};

export function exportEquipmentHistoryToExcel(
  equipmentData: Equipment[],
  historyData: EquipmentHistory[],
  t: (key: string) => string
) {
  const equipmentMap = new Map(equipmentData.map((eq) => [eq.id, eq]));

  const headers = {
    instrument: t("equipment_page.columns.instrument"),
    internalCode: t("equipment_page.columns.internalCode"),
    brand: t("equipment_page.columns.brand"),
    model: t("equipment_page.columns.model"),
    serialNumber: t("equipment_page.columns.serialNumber"),
    date: t("equipment_page.history_columns.date"),
    action: t("equipment_page.history_columns.action"),
    maintenanceType:
      t("maintenance_dialog.categories.title") ||
      t("maintenance_dialog.categories.tipo") ||
      "Maintenance Type",
    status: t("equipment_page.history_columns.status"),
    responsible: t("equipment_page.history_columns.user"),
    description: t("maintenance_dialog.form.description_label"),
  };

  const dataToExport = historyData.map((historyItem) => {
    const equipment = equipmentMap.get(historyItem.equipmentId);
    let maintenanceTypeLabel = "";
    if (historyItem.maintenanceType) {
      const keyBase = historyItem.maintenanceType.toLowerCase();
      const categoryKey = `maintenance_dialog.categories.${keyBase}`;
      const typeKey = `maintenance_dialog.types.${keyBase}`;
      const translatedCategory = t(categoryKey);
      const translatedType = t(typeKey);
      if (translatedCategory !== categoryKey) {
        maintenanceTypeLabel = translatedCategory;
      } else if (translatedType !== typeKey) {
        maintenanceTypeLabel = translatedType;
      } else {
        // Si no existe traducción, mostrar el texto capitalizado y legible
        maintenanceTypeLabel =
          keyBase.charAt(0).toUpperCase() + keyBase.slice(1).replace(/_/g, " ");
      }
    }
    const statusKey = `equipment_page.history_status.${historyItem.status.replace(
      "_",
      " "
    )}`;
    const statusLabel = t(statusKey);

    return {
      [headers.instrument]: equipment?.instrument || "N/A",
      [headers.internalCode]: equipment?.internalCode || "N/A",
      [headers.brand]: equipment?.brand || "N/A",
      [headers.model]: equipment?.model || "N/A",
      [headers.serialNumber]: equipment?.serialNumber || "N/A",
      [headers.date]: historyItem.date,
      [headers.action]: historyItem.action,
      [headers.maintenanceType]: maintenanceTypeLabel,
      [headers.status]: statusLabel,
      [headers.responsible]: historyItem.responsible,
      [headers.description]: historyItem.description || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    t("export_dialog.sheet_name")
  );
  XLSX.writeFile(workbook, "Equipment_History.xlsx");
}

export function exportNotificationLogsToExcel(
  logs: NotificationLog[],
  t: (key: string) => string
) {
  const headers = {
    [t("notifications_page.history.columns.id")]: "",
    [t("notifications_page.history.columns.createdAt")]: "",
    [t("notifications_page.history.columns.notificationType")]: "",
    [t("notifications_page.history.columns.equipmentName")]: "",
    [t("notifications_page.history.columns.equipmentInternalCode")]: "",
    [t("notifications_page.history.columns.subject")]: "",
    [t("notifications_page.history.columns.recipients")]: "",
    [t("notifications_page.history.columns.status")]: "",
    [t("notifications_page.history.columns.sentAt")]: "",
    [t("notifications_page.history.columns.error")]: "",
  };

  const dataToExport =
    logs.length > 0
      ? logs.map((log) => ({
          [t("notifications_page.history.columns.id")]: log.id,
          [t("notifications_page.history.columns.createdAt")]: log.createdAt,
          [t("notifications_page.history.columns.notificationType")]:
            log.notificationType,
          [t("notifications_page.history.columns.equipmentName")]:
            log.equipmentName,
          [t("notifications_page.history.columns.equipmentInternalCode")]:
            log.equipmentInternalCode,
          [t("notifications_page.history.columns.subject")]: log.subject,
          [t("notifications_page.history.columns.recipients")]:
            log.recipients.join(", "),
          [t("notifications_page.history.columns.status")]: log.status,
          [t("notifications_page.history.columns.sentAt")]: log.sentAt,
          [t("notifications_page.history.columns.error")]: log.error || "",
        }))
      : [headers];

  const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
    header: Object.keys(headers), // Ensure headers are in the correct order
  });

  // If there are no logs, we don't want to show the empty row from the headers object
  if (logs.length === 0) {
    worksheet["!ref"] = "A1:J1"; // Adjust the sheet range to only include the header row
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    t("notifications_page.history.sheet_name")
  );
  XLSX.writeFile(workbook, "Notification_Logs.xlsx");
}

export function exportTasksToExcel(
  tasks: AssignedTask[],
  sheetTitle: string,
  t: (key: string) => string
) {
  const headers = {
    equipmentName: t("my_tasks_page.columns.equipment"),
    equipmentModel: t("equipment_page.columns.model"),
    action: t("my_tasks_page.columns.task"),
    scheduledDate: t("my_tasks_page.columns.date"),
    priority: t("my_tasks_page.columns.priority"),
    status: t("my_tasks_page.columns.status"),
    responsible: t("my_tasks_page.columns.responsible"),
  };

  const dataToExport = tasks.map((task) => {
    const priorityKey = `maintenance_dialog.priorities.${task.priority}`;
    const statusKey = `my_tasks_page.status.${task.status
      .toLowerCase()
      .replace(" ", "_")}`;

    return {
      [headers.equipmentName]: task.equipmentName,
      [headers.equipmentModel]: task.equipmentModel,
      [headers.action]: task.action,
      [headers.scheduledDate]: task.scheduledDate,
      [headers.priority]: task.priority ? t(priorityKey) : "N/A",
      [headers.status]: t(statusKey),
      [headers.responsible]: task.responsible,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
  XLSX.writeFile(workbook, `${sheetTitle.replace(/ /g, "_")}.xlsx`);
}
