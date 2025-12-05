"use client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { getEquipments } from "@/services/equipmentService";
import { getHistoryForEquipment } from "@/services/historyService";
import type {
  Equipment,
  MaintenanceStatus,
  ActivityLog,
  EquipmentHistory,
} from "@/lib/types";
import {
  isAfter,
  parseISO,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  Clock,
  Wrench,
  ClipboardCheck,
  XCircle,
  List,
  LineChart,
  Server,
  Archive,
  BrainCircuit,
  Table,
  History,
} from "lucide-react";
import StatCard from "./components/stat-card";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DetailedAnalysisModal } from "./components/detailed-analysis-modal";
import { AiToolsModal } from "./components/ai-tools-modal";
import { MaintenanceAnalysisCard } from "./components/maintenance-analysis-card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const now = new Date();
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [maintenanceHistoryData, setMaintenanceHistoryData] = useState<
    EquipmentHistory[]
  >([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const equipmentData = await getEquipments();
    setAllEquipment(equipmentData);

    const allHistory = await Promise.all(
      equipmentData.map((eq) => getHistoryForEquipment(eq.id))
    );
    setMaintenanceHistoryData(allHistory.flat());

    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const totalEquipment = allEquipment.length;
  const activeEquipment = allEquipment.filter(
    (e) => e.status === "Activos" || e.status === "Operational"
  ).length;
  const inactiveEquipment = totalEquipment - activeEquipment;
  const totalMaintenance = maintenanceHistoryData.length;

  const maintenanceStatusCounts = useMemo(
    () =>
      maintenanceHistoryData.reduce((acc, task) => {
        if (task.status) {
          acc[task.status] = (acc[task.status] || 0) + 1;
        }
        return acc;
      }, {} as Record<MaintenanceStatus, number>),
    [maintenanceHistoryData]
  );

  const overdueTasks = useMemo(
    () =>
      maintenanceHistoryData.filter(
        (task) =>
          task.status === "Programado" &&
          isAfter(now, parseISO(task.scheduledDate))
      ).length,
    [maintenanceHistoryData, now]
  );

  const monthlyMaintenanceData = useMemo(() => {
    const categories = ["preventivo", "correctivo", "predictivo"];
    const dataByCategory: Record<string, any> = {};

    categories.forEach((category) => {
      const monthlyData = Array.from({ length: 3 })
        .map((_, i) => {
          const date = subMonths(now, i);
          const monthName = format(date, "MMM", {
            locale: locale === "es" ? es : undefined,
          });
          const start = startOfMonth(date);
          const end = endOfMonth(date);

          const relevantTasks = maintenanceHistoryData.filter((task) => {
            const taskDate = parseISO(task.scheduledDate);
            const taskCategory = (task.maintenanceType || "otro")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            return (
              taskCategory === category && taskDate >= start && taskDate <= end
            );
          });

          const scheduled = relevantTasks.length;
          const completed = relevantTasks.filter(
            (t) => t.status === "Completado"
          ).length;
          const efficiency =
            scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

          return { month: monthName, scheduled, completed, efficiency };
        })
        .reverse();
      dataByCategory[category] = monthlyData;
    });

    return dataByCategory;
  }, [maintenanceHistoryData, locale, now]);

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-primary/30 transition-all"
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            {t("dashboard.ai_tools.button")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAnalysisModalOpen(true)}
          >
            <Table className="mr-2 h-4 w-4" />
            {t("dashboard.detailed_analysis.button")}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("dashboard.total_equipment")}
            value={totalEquipment.toString()}
            icon={<Server className="h-5 w-5" />}
            variant="info"
          />
          <StatCard
            title={t("dashboard.active_equipment")}
            value={activeEquipment.toString()}
            icon={<LineChart className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title={t("dashboard.inactive_equipment")}
            value={inactiveEquipment.toString()}
            icon={<Archive className="h-5 w-5" />}
            variant="destructive"
          />
          <StatCard
            title={t("dashboard.total_maintenance")}
            value={totalMaintenance.toString()}
            icon={<List className="h-5 w-5" />}
            variant="info"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 mt-6">
        <div className="lg:col-span-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title={t("dashboard.maintenance_status.scheduled")}
              value={(maintenanceStatusCounts.Programado || 0).toString()}
              icon={<Clock className="h-5 w-5" />}
              variant="info"
              className="lg:col-span-1"
            />
            <StatCard
              title={t("dashboard.maintenance_status.in_progress")}
              value={(maintenanceStatusCounts.En_Proceso || 0).toString()}
              icon={<Wrench className="h-5 w-5" />}
              variant="warning"
              className="lg:col-span-1"
            />
            <StatCard
              title={t("dashboard.maintenance_status.completed")}
              value={(maintenanceStatusCounts.Completado || 0).toString()}
              icon={<ClipboardCheck className="h-5 w-5" />}
              variant="success"
              className="lg:col-span-1"
            />
            <StatCard
              title={t("dashboard.maintenance_status.canceled")}
              value={(maintenanceStatusCounts.Cancelado || 0).toString()}
              icon={<XCircle className="mr-2 h-5 w-5" />}
              variant="destructive"
              className="lg:col-span-1"
            />
            <StatCard
              title={t("dashboard.maintenance_status.overdue")}
              value={overdueTasks.toString()}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant="destructive"
              className="lg:col-span-1"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <LineChart className="h-6 w-6" />
          {t("dashboard.analysis_cards.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MaintenanceAnalysisCard
            title={t("dashboard.analysis_cards.preventive")}
            data={monthlyMaintenanceData.preventivo}
            color="bg-blue-600"
            chartColor="hsl(var(--chart-1))"
          />
          <MaintenanceAnalysisCard
            title={t("dashboard.analysis_cards.corrective")}
            data={monthlyMaintenanceData.correctivo}
            color="bg-orange-500"
            chartColor="hsl(var(--chart-2))"
          />
          <MaintenanceAnalysisCard
            title={t("dashboard.analysis_cards.predictive")}
            data={monthlyMaintenanceData.predictivo}
            color="bg-purple-600"
            chartColor="hsl(var(--chart-4))"
          />
        </div>
      </div>

      <DetailedAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        equipmentList={allEquipment}
      />

      <AiToolsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        equipmentList={allEquipment}
      />
    </>
  );
}
