"use client";

import type { NotificationSetting } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, XCircle, Settings, Users, Bell } from "lucide-react";
import { translateOrRaw } from "@/lib/i18n/utils";

interface NotificationSettingCardProps {
  setting: NotificationSetting;
  onConfigure: (setting: NotificationSetting) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  calibration_due: <Calendar className="h-5 w-5" />,
  maintenance_reminder: <Clock className="h-5 w-5" />,
  maintenance_completed: <Clock className="h-5 w-5" />,
  maintenance_overdue: <XCircle className="h-5 w-5" />,
};

const iconColorMap: Record<string, string> = {
  calibration_due:
    "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  maintenance_reminder:
    "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
  maintenance_completed:
    "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  maintenance_overdue:
    "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
};

export function NotificationSettingCard({
  setting,
  onConfigure,
}: NotificationSettingCardProps) {
  const { t } = useI18n();

  // Si el tipo es uno de los estándar, usar la clave de traducción
  const standardTypes = [
    "calibration_due",
    "maintenance_reminder",
    "maintenance_completed",
    "maintenance_overdue",
  ];

  const getTitle = () => {
    if (standardTypes.includes(setting.type)) {
      return t(`notifications_page.settings.${setting.type}.title`);
    }
    return translateOrRaw(setting.title, t);
  };

  const getDescription = () => {
    if (standardTypes.includes(setting.type)) {
      return t(`notifications_page.settings.${setting.type}.description`);
    }
    return translateOrRaw(setting.description, t);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-lg p-2 w-fit",
                iconColorMap[setting.type] || "text-muted-foreground bg-muted"
              )}
            >
              {iconMap[setting.type] || <Bell className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle>{getTitle()}</CardTitle>
              <CardDescription className="mt-1">
                {getDescription()}
              </CardDescription>
            </div>
          </div>
          <Badge
            className={cn(
              "text-xs",
              setting.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {setting.isActive
              ? t("notifications_page.settings.status_active")
              : t("notifications_page.settings.status_inactive")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {setting.daysBefore > 0
              ? t("notifications_page.settings.days_before_text_plural", {
                  count: setting.daysBefore,
                })
              : t("notifications_page.settings.trigger_instant")}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>
              {t("notifications_page.settings.recipient_text_plural", {
                count: setting.recipients.length,
              })}
            </span>
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-3 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConfigure(setting)}
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("notifications_page.settings.configure_button")}
        </Button>
      </CardFooter>
    </Card>
  );
}
