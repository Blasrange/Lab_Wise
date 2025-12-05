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
import type { Equipment, EquipmentHistory } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wrench,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FilePlus,
  X,
} from "lucide-react";
import type { MaintenanceStatus } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TranslatedText } from "@/app/(app)/notifications/components/translated-text";

interface ViewHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  history: EquipmentHistory[];
}

const getActionIcon = (action: string) => {
  if (action.toLowerCase().includes("mantenimiento"))
    return <Wrench className="h-4 w-4" />;
  if (action.toLowerCase().includes("calibración"))
    return <TestTube className="h-4 w-4" />;
  if (action.toLowerCase().includes("creado"))
    return <FilePlus className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
};

const StatusInfo: React.FC<{
  status: MaintenanceStatus;
  t: (key: string) => string;
}> = ({ status, t }) => {
  const statusClasses: Record<MaintenanceStatus, string> = {
    Completado:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Programado:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    En_Proceso:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };
  const statusIcons: Record<MaintenanceStatus, React.ReactNode> = {
    Completado: <CheckCircle className="h-3.5 w-3.5" />,
    Programado: <Clock className="h-3.5 w-3.5" />,
    En_Proceso: <Wrench className="h-3.5 w-3.5 animate-spin" />,
    Cancelado: <XCircle className="h-3.5 w-3.5" />,
  };

  return (
    <Badge className={cn("gap-1.5", statusClasses[status])}>
      {statusIcons[status]}
      <span className="font-medium">
        {t(`equipment_page.history_status.${status}`)}
      </span>
    </Badge>
  );
};

export function ViewHistoryDialog({
  isOpen,
  onClose,
  equipment,
  history,
}: ViewHistoryDialogProps) {
  const { t, locale } = useI18n();

  const sortedHistory = [...history].sort(
    (a, b) =>
      parseISO(b.scheduledDate).getTime() - parseISO(a.scheduledDate).getTime()
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
              <DialogTitle>
                {t("equipment_page.row_actions.view_history")}
              </DialogTitle>
              <DialogDescription>
                {t("equipment_page.history_for")} {equipment.instrument} (S/N:{" "}
                {equipment.serialNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-96 w-full">
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
                      {getActionIcon(entry.action)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "order-1 rounded-lg shadow-xl w-5/12",
                      isRight ? "mr-4" : "ml-4"
                    )}
                  >
                    <Card className={cn(isRight ? "text-right" : "text-left")}>
                      <CardHeader
                        className={cn(
                          "p-3",
                          isRight ? "items-end" : "items-start"
                        )}
                      >
                        <h3 className="font-bold text-primary text-lg">
                          {t(
                            `maintenance_dialog.types.${entry.action
                              .replace(/\s+/g, "_")
                              .toLowerCase()}`
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(entry.scheduledDate), "PPP", {
                            locale: locale === "es" ? es : undefined,
                          })}
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
                          <User className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {entry.user}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
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
