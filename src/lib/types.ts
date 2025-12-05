export type EquipmentStatus =
  | "Operational"
  | "In_Repair"
  | "Decommissioned"
  | "Needs_Calibration"
  | "Activos";
export type MaintenanceStatus =
  | "Programado"
  | "En_Proceso"
  | "Completado"
  | "Cancelado";
export type MaintenanceType =
  | "Preventivo"
  | "Correctivo"
  | "Predictivo"
  | "Otro";

export type Equipment = {
  id: string;
  instrument: string;
  internalCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  systemNumber: string;
  lastExternalCalibration: string;
  nextExternalCalibration: string;
  externalCalibrationPeriodicity: string;
  internalCheckPeriodicity: string;
  status: EquipmentStatus;
  imageUrl: string;
  imageHint: string;
  qrToken?: string;
  nextMaintenance?: string;
  nextCalibration?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  lastCalibration?: string;
  notes?: string;
};

export type EquipmentHistory = {
  id: string;
  equipmentId: string;
  date: string; // Completion date
  scheduledDate: string; // Scheduled date
  action: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  responsible: string;
  user?: string; // User who performed the action
  priority?: "baja" | "media" | "alta";
  description?: string;
};

export type UserRole = "Admin" | "Supervisor" | "Technician";
export type DocumentType = "CC" | "TI" | "CE" | "Pasaporte";

export type UserLocation = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: "Active" | "Inactive";
  avatar: string;
  documentType: DocumentType;
  documentNumber: string;
  lastLogin?: string;
  location?: UserLocation;
};

export type NotificationType =
  | "Maintenance"
  | "Calibration"
  | "Status Change"
  | "AI Suggestion";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
};

export type NotificationSetting = {
  id: string;
  type: string; // e.g., 'calibration_due', 'maintenance_reminder', etc.
  title: string;
  description: string;
  daysBefore: number;
  recipients: string[];
  isActive: boolean;
};

export type NotificationLog = {
  id: string;
  createdAt: string;
  notificationType: string;
  equipmentName: string;
  equipmentInternalCode: string;
  subject: string;
  recipients: string[];
  status: "Sent" | "Failed";
  sentAt: string;
  error?: string;
};

export type ActivityLogActionType =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_STATUS_TOGGLED"
  | "EQUIPMENT_CREATED"
  | "EQUIPMENT_UPDATED"
  | "MAINTENANCE_SCHEDULED"
  | "MAINTENANCE_STATUS_UPDATED"
  | "SYSTEM_ERROR"
  | "PASSWORD_RESET_REQUEST"
  | "USER_LOGIN";

export type ActivityLog = {
  id: string;
  timestamp: string;
  user: string; // Name of the user who performed the action
  actionType: ActivityLogActionType;
  description: string;
  details?: Record<string, any>;
};
