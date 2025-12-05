"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { NotificationLog } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileDown,
  Bell,
  Calendar,
  Wrench,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface NotificationHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
}

const getActionIcon = (action: string) => {
  if (action.toLowerCase().includes("calibration"))
    return <Calendar className="h-4 w-4" />;
  if (action.toLowerCase().includes("maintenance"))
    return <Wrench className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

const StatusInfo: React.FC<{
  status: string;
  t: (key: string) => string;
}> = ({ status, t }) => {
  // Normaliza el estado para mostrarlo correctamente
  const normalized = status?.toLowerCase();
  let label = status;
  let icon = <Bell className="h-3.5 w-3.5" />;
  let classes =
    "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";

  if (normalized === "sent" || normalized === "completado") {
    label = t("notifications_page.status.sent") || "Completado";
    icon = <CheckCircle className="h-3.5 w-3.5" />;
    classes =
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  } else if (normalized === "failed" || normalized === "fallido") {
    label = t("notifications_page.status.failed") || "Fallido";
    icon = <XCircle className="h-3.5 w-3.5" />;
    classes = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  } else if (normalized === "programado" || normalized === "scheduled") {
    label = t("notifications_page.status.scheduled") || "Programado";
    icon = <Clock className="h-3.5 w-3.5" />;
    classes =
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
  }

  return (
    <Badge className={cn("gap-1.5", classes)}>
      {icon}
      <span className="font-medium">{label}</span>
    </Badge>
  );
};

export function NotificationHistoryDialog({
  isOpen,
  onClose,
  logs,
}: NotificationHistoryDialogProps) {
  const { t, locale } = useI18n();

  const sortedHistory = [...logs].sort(
    (a, b) => parseISO(b.sentAt).getTime() - parseISO(a.sentAt).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("notifications_page.history.title")}</DialogTitle>
              <DialogDescription>
                {t("notifications_page.history.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-96 w-full">
          {sortedHistory.length > 0 ? (
            <div className="relative wrap overflow-hidden p-10 h-full">
              <div className="absolute left-1/2 h-full border border-border border-dashed"></div>

              {sortedHistory.map((entry, index) => {
                const isRight = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={cn(
                      "mb-8 flex justify-between w-full",
                      isRight ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className="order-1 w-5/12"></div>
                    <div className="z-10 flex items-center order-1 bg-secondary shadow-xl w-8 h-8 rounded-full">
                      <div className="w-full text-center text-secondary-foreground">
                        {getActionIcon(entry.notificationType)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "order-1 rounded-lg shadow-xl w-5/12",
                        isRight ? "mr-4" : "ml-4"
                      )}
                    >
                      <Card
                        className={cn(isRight ? "text-right" : "text-left")}
                      >
                        <CardHeader
                          className={cn(
                            "p-3",
                            isRight ? "items-end" : "items-start"
                          )}
                        >
                          <h3 className="font-bold text-primary text-md">
                            {entry.subject}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(entry.sentAt), "PPpp", {
                              locale: locale === "es" ? es : undefined,
                            })}
                          </p>
                          <p className="text-xs mt-1 text-muted-foreground">
                            <span className="font-semibold">
                              {t(
                                "notifications_page.history.columns.notificationType"
                              )}
                              :
                            </span>
                            {t(
                              `notifications_page.settings.${entry.notificationType}.title`
                            ) || entry.notificationType}
                          </p>
                        </CardHeader>
                        <CardContent
                          className={cn(
                            "p-3 pt-0",
                            isRight ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-4 mb-2",
                              isRight ? "justify-end" : "justify-start"
                            )}
                          >
                            <StatusInfo status={entry.status} t={t} />
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-muted-foreground",
                              isRight ? "justify-end" : "justify-start"
                            )}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">
                              {entry.recipients.join(", ")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10">
              <Mail className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">
                {t("notifications_page.history.no_results")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("notifications_page.history.no_results_desc")}
              </p>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            {t("equipment_page.form.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
