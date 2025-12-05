"use client";

import type { ActivityLog, MaintenanceStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  User,
  Wrench,
  PlusCircle,
  Power,
  Edit,
  History,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TranslatedText } from "@/app/(app)/notifications/components/translated-text";

type ActivityCardProps = {
  log: ActivityLog;
};

const getActionInfo = (
  action: ActivityLog["actionType"]
): { icon: React.ReactNode; color: string } => {
  const iconClass = "h-6 w-6";
  switch (action) {
    case "USER_CREATED":
      return {
        icon: <PlusCircle className={iconClass} />,
        color: "text-green-500 bg-green-100 dark:bg-green-900/30",
      };
    case "USER_UPDATED":
      return {
        icon: <Edit className={iconClass} />,
        color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      };
    case "USER_STATUS_TOGGLED":
      return {
        icon: <Power className={iconClass} />,
        color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
      };
    case "EQUIPMENT_CREATED":
      return {
        icon: <PlusCircle className={iconClass} />,
        color: "text-green-500 bg-green-100 dark:bg-green-900/30",
      };
    case "EQUIPMENT_UPDATED":
      return {
        icon: <Edit className={iconClass} />,
        color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      };
    case "MAINTENANCE_SCHEDULED":
      return {
        icon: <Wrench className={iconClass} />,
        color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
      };
    case "MAINTENANCE_STATUS_UPDATED":
      return {
        icon: <Wrench className={iconClass} />,
        color: "text-teal-500 bg-teal-100 dark:bg-teal-900/30",
      };
    case "SYSTEM_ERROR":
      return {
        icon: <AlertTriangle className={iconClass} />,
        color: "text-red-500 bg-red-100 dark:bg-red-900/30",
      };
    case "PASSWORD_RESET_REQUEST":
      return {
        icon: <Power className={iconClass} />,
        color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
      };
    default:
      return {
        icon: <History className={iconClass} />,
        color: "text-gray-500 bg-gray-100 dark:bg-gray-800",
      };
  }
};

const actionToTranslationKey: Record<string, string> = {
  "Equipo Creado": "maintenance_dialog.types.equipment_created",
};

const getActivityDescription = (
  log: ActivityLog,
  t: (key: string, replacements?: Record<string, string | number>) => string
): React.ReactNode => {
  const { actionType, details, description } = log;

  // Si la descripción es una llave de traducción, traducir con t()
  if (
    actionType.endsWith("_SCHEDULED") ||
    actionType.endsWith("_UPDATED") ||
    actionType.endsWith("_CREATED")
  ) {
    if (description) {
      // Si la descripción es una llave de traducción, traducir
      if (
        typeof description === "string" &&
        (description.startsWith("maintenance_dialog.types.") ||
          description.startsWith("system_log_page.descriptions.") ||
          description.startsWith("equipment_page.history_status."))
      ) {
        const translated = t(description);
        return translated === description ? description : translated;
      }

      // Si la acción tiene detalles relevantes, mostrar acción + nombre
      // Ejemplo: Updated equipment "Balanza Analítica"
      if (log.details?.equipmentName) {
        switch (actionType) {
          case "EQUIPMENT_UPDATED":
            return t("system_log_page.descriptions.equipment_updated", {
              name: log.details.equipmentName,
            });
          case "EQUIPMENT_CREATED":
            return t("system_log_page.descriptions.equipment_created", {
              name: log.details.equipmentName,
            });
          case "MAINTENANCE_SCHEDULED": {
            // Si la tarea es una llave, traducirla
            let taskText = description;
            if (
              typeof description === "string" &&
              description.startsWith("maintenance_dialog.types.")
            ) {
              const translatedTask = t(description);
              taskText =
                translatedTask !== description ? translatedTask : description;
            }
            return t("system_log_page.descriptions.maintenance_scheduled", {
              task: taskText,
              equipmentName: log.details.equipmentName,
            });
          }
          case "MAINTENANCE_STATUS_UPDATED": {
            // Si el estado es una llave, traducirlo
            let statusText = log.details.newStatus;
            if (
              typeof statusText === "string" &&
              statusText.startsWith("equipment_page.history_status.")
            ) {
              const translatedStatus = t(statusText);
              statusText =
                translatedStatus !== statusText ? translatedStatus : statusText;
            }
            return t(
              "system_log_page.descriptions.maintenance_status_updated",
              {
                newStatus: statusText,
                equipmentName: log.details.equipmentName,
              }
            );
          }
          default:
            return description;
        }
      }
      // Si hay nombre de usuario
      if (log.details?.entityName) {
        let actionText = "";
        switch (actionType) {
          case "USER_UPDATED":
            actionText = t("system_log_page.descriptions.user_updated", {
              name: log.details.entityName,
            });
            break;
          case "USER_CREATED":
            actionText = t("system_log_page.descriptions.user_created", {
              name: log.details.entityName,
              role: log.details.role,
            });
            break;
          default:
            actionText = description;
        }
        return actionText;
      }
      // Si no hay detalles, mostrar la descripción literal
      return description;
    }
  }

  if (actionType === "SYSTEM_ERROR") {
    let errorKey = "system_log_page.errors.generic";
    if (description?.includes("AI Smart Alert")) {
      errorKey = "system_log_page.errors.ai_alert_failed";
    } else if (description?.includes("password reset")) {
      errorKey = "system_log_page.errors.password_reset_failed";
    }
    return <TranslatedText text={errorKey} />;
  }

  const formattedStatus = details?.newStatus
    ? t(`equipment_page.history_status.${details.newStatus.replace("_", " ")}`)
    : "";

  const replacements = {
    name: details?.entityName || "",
    status: details?.newStatus || "",
    role: details?.role || "",
    equipmentName: details?.equipmentName || "",
    email: details?.email || "",
    newStatus: formattedStatus,
  };

  let baseKey: string;

  switch (actionType) {
    case "USER_CREATED":
      baseKey = "system_log_page.descriptions.user_created";
      break;
    case "USER_UPDATED":
      baseKey = "system_log_page.descriptions.user_updated";
      break;
    case "USER_STATUS_TOGGLED":
      baseKey =
        details?.newStatus === "Active"
          ? "system_log_page.descriptions.user_activated"
          : "system_log_page.descriptions.user_deactivated";
      break;
    case "PASSWORD_RESET_REQUEST":
      baseKey = "system_log_page.descriptions.password_reset_request";
      break;
    default:
      // Fallback for custom or unknown actions
      return (
        <TranslatedText
          text={description || "system_log_page.descriptions.unknown_action"}
        />
      );
  }

  const translated = t(baseKey, replacements);

  // If translation fails, return the original description or a default message
  return translated === baseKey ? (
    <TranslatedText
      text={description || "system_log_page.descriptions.unknown_action"}
    />
  ) : (
    translated
  );
};

const DetailsView = ({ details }: { details: Record<string, any> }) => {
  const { t } = useI18n();

  if (details.before && details.after) {
    const allKeys = [
      ...Object.keys(details.before),
      ...Object.keys(details.after),
    ];
    const uniqueSortedKeys = [...new Set(allKeys)].sort();

    const renderValue = (value: any) => {
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return (
      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
        <div>
          <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
            {t("system_log_page.before")}
          </h4>
          <div className="space-y-1 bg-background p-3 rounded-md border">
            {uniqueSortedKeys.map((key) => (
              <div key={`before-${key}`} className="flex">
                <span className="w-1/3 text-muted-foreground">{key}:</span>
                <span className="flex-1 truncate">
                  {renderValue(details.before[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            {t("system_log_page.after")}
          </h4>
          <div className="space-y-1 bg-background p-3 rounded-md border">
            {uniqueSortedKeys.map((key) => {
              const valueBefore = JSON.stringify(details.before[key]);
              const valueAfter = JSON.stringify(details.after[key]);
              const isChanged = valueBefore !== valueAfter;
              return (
                <div
                  key={`after-${key}`}
                  className={cn(
                    "flex",
                    isChanged &&
                      "bg-green-100/50 dark:bg-green-900/20 rounded-sm -mx-1 px-1"
                  )}
                >
                  <span className="w-1/3 text-muted-foreground">{key}:</span>
                  <span className="flex-1 truncate">
                    {renderValue(details.after[key])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <pre className="text-xs bg-background p-3 rounded-md border overflow-x-auto">
      {JSON.stringify(details, null, 2)}
    </pre>
  );
};

export function ActivityCard({ log }: ActivityCardProps) {
  const { t, locale } = useI18n();
  const { icon, color } = getActionInfo(log.actionType);
  const descriptionNode = getActivityDescription(log, t);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className={cn("flex-shrink-0 rounded-full p-3", color)}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{descriptionNode}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{log.user}</span>
            </div>
            <span>•</span>
            <span>
              {format(parseISO(log.timestamp), "PPP, p", {
                locale: locale === "es" ? es : undefined,
              })}
            </span>
          </div>
        </div>
      </div>
      {log.details && Object.keys(log.details).length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-t bg-muted/50">
            <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t("system_log_page.view_details")}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DetailsView details={log.details} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
}
