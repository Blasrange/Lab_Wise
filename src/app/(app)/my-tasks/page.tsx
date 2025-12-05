"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getEquipments } from "@/services/equipmentService";
import { getHistoryForEquipment } from "@/services/historyService";
import type {
  EquipmentHistory,
  Equipment,
  MaintenanceStatus,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Circle,
  Wrench,
  Clock,
  CheckCircle,
  User,
  FileDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExportTasksDialog } from "./components/export-tasks-dialog";
import { TranslatedText } from "@/app/(app)/notifications/components/translated-text";

type AssignedTask = EquipmentHistory & {
  equipmentName: string;
  equipmentModel: string;
};

const PriorityBadge = ({
  priority,
}: {
  priority: "baja" | "media" | "alta";
}) => {
  const { t } = useI18n();
  const priorityClasses = {
    alta: "bg-red-100 text-red-800 border-red-200",
    media: "bg-yellow-100 text-yellow-800 border-yellow-200",
    baja: "bg-green-100 text-green-800 border-green-200",
  };
  const priorityText = {
    alta: t("maintenance_dialog.priorities.high"),
    media: t("maintenance_dialog.priorities.medium"),
    baja: t("maintenance_dialog.priorities.low"),
  };
  return (
    <Badge className={cn("capitalize", priorityClasses[priority])}>
      {priorityText[priority]}
    </Badge>
  );
};

const TaskStatusBadge = ({ status }: { status: MaintenanceStatus }) => {
  const { t } = useI18n();
  const statusKey = status.replace("_", " ") as MaintenanceStatus;
  const statusClasses: Record<string, string> = {
    Programado: "bg-blue-100 text-blue-800 border-blue-200",
    "En Proceso": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Completado: "bg-green-100 text-green-800 border-green-200",
    Cancelado: "bg-red-100 text-red-800 border-red-200",
  };
  const statusIcons: Record<string, React.ReactNode> = {
    Programado: <Clock className="h-3 w-3" />,
    "En Proceso": <Wrench className="h-3 w-3" />,
    Completado: <CheckCircle className="h-3 w-3" />,
    Cancelado: <Circle className="h-3 w-3" />,
  };
  return (
    <Badge
      className={cn(
        "capitalize flex items-center gap-1.5",
        statusClasses[statusKey]
      )}
    >
      {statusIcons[statusKey]}
      <span>
        {t(`my_tasks_page.status.${statusKey.toLowerCase().replace(" ", "_")}`)}
      </span>
    </Badge>
  );
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [allHistory, setAllHistory] = useState<AssignedTask[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    const equipments = await getEquipments();
    setAllEquipment(equipments);

    const histories = await Promise.all(
      equipments.map(async (eq) => {
        const historyForEq = await getHistoryForEquipment(eq.id);
        return historyForEq.map((h) => ({
          ...h,
          equipmentName: eq.instrument,
          equipmentModel: eq.model,
        }));
      })
    );
    setAllHistory(histories.flat());
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const assignedTasks = useMemo(() => {
    if (!user) return [];

    if (user.role === "Admin" || user.role === "Supervisor") {
      return allHistory.sort(
        (a, b) =>
          parseISO(b.scheduledDate).getTime() -
          parseISO(a.scheduledDate).getTime()
      );
    }

    return allHistory
      .filter((h: any) => h.responsible === user.name)
      .sort(
        (a: any, b: any) =>
          parseISO(b.scheduledDate).getTime() -
          parseISO(a.scheduledDate).getTime()
      );
  }, [user, allHistory]);

  const pendingTasks = assignedTasks.filter(
    (t) => t.status === "Programado" || t.status === "En_Proceso"
  );
  const completedTasks = assignedTasks.filter((t) => t.status === "Completado");

  const TaskTable = ({
    tasks,
    title,
    emptyMessage,
  }: {
    tasks: AssignedTask[];
    title: string;
    emptyMessage: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>{t("my_tasks_page.columns.equipment")}</TableHead>
                <TableHead>{t("my_tasks_page.columns.task")}</TableHead>
                <TableHead>{t("my_tasks_page.columns.date")}</TableHead>
                <TableHead>{t("my_tasks_page.columns.priority")}</TableHead>
                <TableHead>{t("my_tasks_page.columns.status")}</TableHead>
                {(user?.role === "Admin" || user?.role === "Supervisor") && (
                  <TableHead>
                    {t("my_tasks_page.columns.responsible")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.equipmentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.equipmentModel}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t(
                        `maintenance_dialog.types.${task.action
                          .replace(/\s+/g, "_")
                          .toLowerCase()}`
                      )}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(task.scheduledDate), "PPP", {
                        locale: locale === "es" ? es : undefined,
                      })}
                    </TableCell>
                    <TableCell>
                      {task.priority && (
                        <PriorityBadge priority={task.priority} />
                      )}
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    {(user?.role === "Admin" ||
                      user?.role === "Supervisor") && (
                      <TableCell>{task.responsible}</TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      user?.role === "Admin" || user?.role === "Supervisor"
                        ? 6
                        : 5
                    }
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
                      <span className="text-muted-foreground">
                        {emptyMessage}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        title=""
        description=""
        actions={
          <Button
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            onClick={() => setIsExportOpen(true)}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {t("equipment_page.export_button")}
          </Button>
        }
      />
      <div className="space-y-8">
        <TaskTable
          tasks={pendingTasks}
          title={t("my_tasks_page.pending_title")}
          emptyMessage={t("my_tasks_page.no_pending_tasks")}
        />
        <TaskTable
          tasks={completedTasks}
          title={t("my_tasks_page.completed_title")}
          emptyMessage={t("my_tasks_page.no_completed_tasks")}
        />
      </div>

      <ExportTasksDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
      />
    </>
  );
}
