"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  Equipment,
  EquipmentHistory,
  MaintenanceStatus,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Table as TableIcon,
} from "lucide-react";
import { isAfter, parseISO, format, isBefore } from "date-fns";
import { getHistoryForEquipment } from "@/services/historyService";
import { TranslatedText } from "@/app/(app)/notifications/components/translated-text";

const getPriorityClasses = (priority: string | undefined) => {
  switch (priority) {
    case "alta":
      return "bg-red-100 text-red-800 border-red-200";
    case "media":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "baja":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const priorityKeyMap: Record<string, string> = {
  alta: "high",
  media: "medium",
  baja: "low",
};

type MaintenanceTask = EquipmentHistory & {
  equipmentName: string;
  equipmentModel: string;
};

const AnalysisTable = ({
  title,
  icon,
  data,
  columns,
  headerClass,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  data: any[];
  columns: { key: string; label: string }[];
  headerClass: string;
  emptyText: string;
}) => {
  const { t } = useI18n();

  const getDisplayValue = (item: any, col: { key: string; label: string }) => {
    const value = item[col.key];
    switch (col.key) {
      case "type":
        const normalizedValue = (value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const categoryKey = `maintenance_dialog.categories.${normalizedValue}`;
        return (
          <Badge variant="outline" className="capitalize">
            <TranslatedText text={categoryKey} />
          </Badge>
        );
      case "priority":
        const priorityKey =
          priorityKeyMap[value as keyof typeof priorityKeyMap] || "medium";
        const priorityLabelKey = `maintenance_dialog.priorities.${priorityKey}`;
        return (
          <Badge className={cn("capitalize", getPriorityClasses(value))}>
            <TranslatedText text={priorityLabelKey} />
          </Badge>
        );
      case "status":
        const formattedStatus = (value || "").replace(/_/g, " ");
        return (
          <Badge variant="secondary" className="capitalize">
            <TranslatedText
              text={`equipment_page.history_status.${formattedStatus}`}
            />
          </Badge>
        );
      case "action":
        // Traducir la acción usando la clave de traducción
        return t(
          `maintenance_dialog.types.${String(value)
            .replace(/\s+/g, "_")
            .toLowerCase()}`
        );
      default:
        return value;
    }
  };

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader className={cn("text-white p-3 rounded-t-lg", headerClass)}>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          <span>
            {title} ({data.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className="font-bold">
                    {t(col.label)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="py-2 text-xs">
                        {getDisplayValue(item, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center h-24 text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface DetailedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
}

export function DetailedAnalysisModal({
  isOpen,
  onClose,
  equipmentList,
}: DetailedAnalysisModalProps) {
  const { t } = useI18n();
  const now = new Date();
  const [allTasks, setAllTasks] = useState<MaintenanceTask[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchAllHistory = async () => {
        const historyPromises = equipmentList.map(async (eq) => {
          const history = await getHistoryForEquipment(eq.id);
          return history.map((h) => ({
            ...h,
            equipmentName: eq.instrument,
            equipmentModel: eq.model,
            type: h.maintenanceType,
          }));
        });
        const allHistory = (await Promise.all(historyPromises)).flat();
        setAllTasks(allHistory as MaintenanceTask[]);
      };
      fetchAllHistory();
    }
  }, [isOpen, equipmentList]);

  const upcomingTasks = allTasks.filter(
    (t) => t.status === "Programado" && isAfter(parseISO(t.scheduledDate), now)
  );
  const inProgressTasks = allTasks.filter((t) => t.status === "En_Proceso");
  const recentlyCompletedTasks = allTasks
    .filter(
      (t) =>
        t.status === "Completado" &&
        isAfter(
          parseISO(t.date),
          new Date(new Date().setMonth(new Date().getMonth() - 3))
        )
    )
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  const attentionRequiredTasks = equipmentList.filter(
    (eq) => eq.status === "In_Repair" || eq.status === "Needs_Calibration"
  );
  const overdueTasks = allTasks.filter(
    (t) => t.status === "Programado" && isBefore(parseISO(t.scheduledDate), now)
  );
  const canceledTasks = allTasks.filter((t) => t.status === "Cancelado");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <TableIcon className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>
                {t("dashboard.detailed_analysis.title")}
              </DialogTitle>
              <DialogDescription>
                {t("dashboard.detailed_analysis.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-full">
          <div className="p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnalysisTable
                title={t("dashboard.detailed_analysis.upcoming_maintenance")}
                icon={<Clock className="h-5 w-5" />}
                data={upcomingTasks}
                columns={[
                  {
                    key: "equipmentName",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "scheduledDate",
                    label: "dashboard.detailed_analysis.columns.date",
                  },
                  {
                    key: "action",
                    label: "dashboard.detailed_analysis.columns.category",
                  },
                  {
                    key: "type",
                    label: "dashboard.detailed_analysis.columns.type",
                  },
                  {
                    key: "priority",
                    label: "dashboard.detailed_analysis.columns.priority",
                  },
                ]}
                headerClass="bg-blue-500"
                emptyText={t("dashboard.detailed_analysis.empty.upcoming")}
              />
              <AnalysisTable
                title={t("dashboard.detailed_analysis.in_progress")}
                icon={<Wrench className="h-5 w-5" />}
                data={inProgressTasks}
                columns={[
                  {
                    key: "equipmentName",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "action",
                    label: "dashboard.detailed_analysis.columns.category",
                  },
                  {
                    key: "type",
                    label: "dashboard.detailed_analysis.columns.type",
                  },
                  {
                    key: "priority",
                    label: "dashboard.detailed_analysis.columns.priority",
                  },
                ]}
                headerClass="bg-orange-500"
                emptyText={t("dashboard.detailed_analysis.empty.in_progress")}
              />
              <AnalysisTable
                title={t("dashboard.detailed_analysis.recently_completed")}
                icon={<CheckCircle className="h-5 w-5" />}
                data={recentlyCompletedTasks}
                columns={[
                  {
                    key: "equipmentName",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "action",
                    label: "dashboard.detailed_analysis.columns.category",
                  },
                  {
                    key: "type",
                    label: "dashboard.detailed_analysis.columns.type",
                  },
                  {
                    key: "date",
                    label:
                      "dashboard.detailed_analysis.columns.realization_date",
                  },
                  {
                    key: "status",
                    label: "dashboard.detailed_analysis.columns.status",
                  },
                ]}
                headerClass="bg-green-600"
                emptyText={t("dashboard.detailed_analysis.empty.completed")}
              />
              <AnalysisTable
                title={t("dashboard.detailed_analysis.attention_required")}
                icon={<AlertTriangle className="h-5 w-5" />}
                data={attentionRequiredTasks}
                columns={[
                  {
                    key: "instrument",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "status",
                    label: "dashboard.detailed_analysis.columns.status",
                  },
                  {
                    key: "nextExternalCalibration",
                    label:
                      "dashboard.detailed_analysis.columns.next_calibration",
                  },
                ]}
                headerClass="bg-red-600"
                emptyText={t("dashboard.detailed_analysis.empty.attention")}
              />
              <AnalysisTable
                title={t("dashboard.detailed_analysis.overdue_maintenance")}
                icon={<Calendar className="h-5 w-5" />}
                data={overdueTasks}
                columns={[
                  {
                    key: "equipmentName",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "action",
                    label: "dashboard.detailed_analysis.columns.category",
                  },
                  {
                    key: "type",
                    label: "dashboard.detailed_analysis.columns.type",
                  },
                  {
                    key: "scheduledDate",
                    label: "dashboard.detailed_analysis.columns.date",
                  },
                  {
                    key: "priority",
                    label: "dashboard.detailed_analysis.columns.priority",
                  },
                ]}
                headerClass="bg-red-700"
                emptyText={t("dashboard.detailed_analysis.empty.overdue")}
              />
              <AnalysisTable
                title={t("dashboard.detailed_analysis.canceled_maintenance")}
                icon={<XCircle className="h-5 w-5" />}
                data={canceledTasks}
                columns={[
                  {
                    key: "equipmentName",
                    label: "dashboard.detailed_analysis.columns.equipment",
                  },
                  {
                    key: "action",
                    label: "dashboard.detailed_analysis.columns.category",
                  },
                  {
                    key: "type",
                    label: "dashboard.detailed_analysis.columns.type",
                  },
                  {
                    key: "scheduledDate",
                    label: "dashboard.detailed_analysis.columns.date",
                  },
                ]}
                headerClass="bg-gray-500"
                emptyText={t("dashboard.detailed_analysis.empty.canceled")}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
