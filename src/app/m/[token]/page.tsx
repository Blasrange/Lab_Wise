"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type {
  Equipment,
  MaintenanceStatus,
  EquipmentHistory,
  User,
  EquipmentStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Grid3x3,
  ClipboardList,
  RefreshCw,
  Plus,
  Loader,
  Wrench,
  Circle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScheduleMaintenanceDialog } from "@/app/(app)/equipment/components/schedule-maintenance-dialog";
import { addActivityLog } from "@/services/activityLogService";
import LanguageSwitcher from "@/components/layout/language-switcher";
import Image from "next/image";

function MobileMaintenancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Next.js 14+: params es una promesa, se debe usar React.use()
  // https://nextjs.org/docs/messages/params-promise
  const { token } = React.use(params);
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const maintenanceStatuses: MaintenanceStatus[] = [
    "Programado",
    "En_Proceso",
    "Completado",
    "Cancelado",
  ];

  const statusInfo: Record<string, { color: string; icon: React.ReactNode }> =
    useMemo(
      () => ({
        Programado: {
          color: "text-blue-800 dark:text-blue-300",
          icon: <Circle className="h-3 w-3 fill-current" />,
        },
        En_Proceso: {
          color: "text-yellow-800 dark:text-yellow-300",
          icon: <Circle className="h-3 w-3 fill-current" />,
        },
        "En Proceso": {
          color: "text-yellow-800 dark:text-yellow-300",
          icon: <Circle className="h-3 w-3 fill-current" />,
        },
        Completado: {
          color: "text-green-800 dark:text-green-300",
          icon: <Circle className="h-3 w-3 fill-current" />,
        },
        Cancelado: {
          color: "text-red-800 dark:text-red-300",
          icon: <Circle className="h-3 w-3 fill-current" />,
        },
      }),
      []
    );

  const headerColorClasses: Record<EquipmentStatus, string> = {
    Activos: "bg-primary",
    Operational: "bg-primary",
    In_Repair: "bg-orange-500",
    Needs_Calibration: "bg-yellow-500",
    Decommissioned: "bg-gray-500",
  };

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    if (token) {
      try {
        const response = await fetch(`/api/equipment/${token}`);
        if (response.ok) {
          const data = await response.json();
          setEquipment(data);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch equipment");
        }
      } catch (error) {
        console.error("Failed to fetch equipment", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
        setEquipment(null);
      }
    }
    setLoading(false);
  }, [token, toast]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleMaintenanceAdded = async () => {
    setIsMaintenanceOpen(false);
    await fetchEquipment(); // Re-fetch all data
    toast({
      variant: "success",
      title: t("maintenance_dialog.toast.success_title"),
      description: t("maintenance_dialog.toast.success_desc"),
    });
  };

  const handleStatusChange = async (
    task: EquipmentHistory,
    newStatus: MaintenanceStatus
  ) => {
    if (!equipment) return;
    setUpdating(task.id);

    try {
      const response = await fetch(`/api/equipment/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          newStatus: newStatus,
          user: "Mobile User",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data); // The API returns the fully updated equipment object
        toast({
          variant: "success",
          title: t("mobile_view.toast.status_updated_title"),
          description: t("mobile_view.toast.status_updated_desc"),
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status", error);
      addActivityLog({
        user: "Mobile User",
        actionType: "SYSTEM_ERROR",
        description: "Failed to update maintenance status from mobile view.",
        details: {
          context: "Mobile Maintenance View - Status Update",
          equipmentId: equipment.id,
          taskAction: task.action,
          newStatus: newStatus,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as Error).message ||
          "An error occurred while updating the status.",
      });
    } finally {
      setUpdating(null);
    }
  };

  // Adaptar para usar 'historial' como fuente de mantenimientos
  const pendingTasks = useMemo(() => {
    if (!equipment || !("historial" in equipment) || !equipment.historial)
      return [];
    return (equipment.historial as EquipmentHistory[])
      .filter((h) => h.status === "Programado" || h.status === "En_Proceso")
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }, [equipment]);

  const getTaskCountText = (count: number) => {
    if (locale === "es") {
      return count === 1 ? "1 tarea" : `${count} tareas`;
    }
    return count === 1 ? "1 task" : `${count} tasks`;
  };

  const getTranslatedStatus = (status: MaintenanceStatus) => {
    const formattedStatus = status.replace(/_/g, " ");
    return t(`equipment_page.history_status.${formattedStatus}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center">
          <FlaskConical className="h-20 w-20 animate-pulse text-primary" />
          <p className="mt-4 text-lg font-semibold text-primary">
            {t("loading.text")}...
          </p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center dark:bg-gray-900">
        <FlaskConical className="h-20 w-20 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">
          {t("mobile_view.not_found.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("mobile_view.not_found.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-0 md:p-4 flex justify-center">
      <div className="w-full max-w-5xl">
        <header
          className={cn(
            "relative w-full rounded-t-lg p-4 text-white shadow-md md:rounded-lg",
            headerColorClasses[equipment.status] || "bg-primary"
          )}
        >
          <div className="absolute top-2 left-2">
            <LanguageSwitcher />
          </div>
          <div className="absolute top-2 right-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/20 text-white hover:bg-white/30 h-10 w-10 border-white/50"
              onClick={() => setIsMaintenanceOpen(true)}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">{t("mobile_view.add_new_task")}</span>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold md:text-2xl">
              {t("mobile_view.header.title")}
            </h1>
            <p className="text-sm opacity-90">
              {t("mobile_view.header.subtitle")}
            </p>
          </div>
        </header>

        <main className="w-full space-y-6 p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-950 rounded-b-lg md:shadow-md">
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={equipment.imageUrl}
                    alt={equipment.instrument}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{equipment.instrument}</h2>
                  <p className="text-sm text-muted-foreground">
                    {equipment.brand} {equipment.model} - S/N:{" "}
                    {equipment.serialNumber}
                  </p>
                  <Badge
                    className="mt-2"
                    variant={
                      equipment.status === "Activos" ||
                      equipment.status === "Operational"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {t(`equipment_page.status_options.${equipment.status}`)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchEquipment}
                  disabled={loading}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                </Button>
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-bold">
                    {t("mobile_view.tasks_title")}
                  </h2>
                </div>
                <Badge variant="secondary">
                  {getTaskCountText(pendingTasks.length)}
                </Badge>
              </div>

              {pendingTasks.length > 0 ? (
                <div className="space-y-4">
                  {pendingTasks.map((task) => {
                    const statusKey = task.status.replace(
                      "_",
                      " "
                    ) as MaintenanceStatus;
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold">{task.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(task.scheduledDate).toLocaleDateString(
                                locale,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {updating === task.id && (
                              <Loader className="h-4 w-4 animate-spin" />
                            )}
                            <Select
                              value={task.status}
                              onValueChange={(newStatus: MaintenanceStatus) =>
                                handleStatusChange(task, newStatus)
                              }
                              disabled={updating === task.id}
                            >
                              <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue>
                                  <div
                                    className={cn(
                                      "flex items-center gap-2",
                                      statusInfo[statusKey]?.color
                                    )}
                                  >
                                    {statusInfo[statusKey]?.icon}
                                    <span>
                                      {getTranslatedStatus(task.status)}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {maintenanceStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <div
                                      className={cn(
                                        "flex items-center gap-2",
                                        statusInfo[status.replace("_", " ")]
                                          ?.color
                                      )}
                                    >
                                      {
                                        statusInfo[status.replace("_", " ")]
                                          ?.icon
                                      }
                                      <span>{getTranslatedStatus(status)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 h-48 text-center text-muted-foreground p-4">
                  <ClipboardList className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 font-semibold">
                    {t("mobile_view.no_tasks.title")}
                  </p>
                  <p className="text-sm">
                    {t("mobile_view.no_tasks.subtitle")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {isMaintenanceOpen && equipment && (
        <ScheduleMaintenanceDialog
          isOpen={isMaintenanceOpen}
          onClose={() => setIsMaintenanceOpen(false)}
          equipment={equipment}
          onMaintenanceAdded={handleMaintenanceAdded}
          currentUser={undefined}
          users={users}
        />
      )}
    </div>
  );
}

export default MobileMaintenancePage;
