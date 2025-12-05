"use client";

import { useState, useEffect } from "react";
import type { Row } from "@tanstack/react-table";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type {
  Equipment,
  EquipmentHistory,
  MaintenanceStatus,
  EquipmentStatus,
  MaintenanceType,
} from "@/lib/types";
import { getHistoryForEquipment } from "@/services/historyService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranslatedText } from "@/app/(app)/notifications/components/translated-text";

const StatusBadge = ({ status }: { status: MaintenanceStatus }) => {
  const { t } = useI18n();
  const statusClasses: Record<string, string> = {
    Completado:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-600",
    Programado:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-600",
    En_Proceso:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600",
    "En Proceso":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600",
    Cancelado:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-600",
  };
  const formattedStatus = status.replace("_", " ") as MaintenanceStatus;

  return (
    <Badge className={cn("font-medium", statusClasses[status])}>
      {t(`equipment_page.history_status.${formattedStatus}`)}
    </Badge>
  );
};

const getStatusTranslationKey = (status: EquipmentStatus): string => {
  const keyMap: Record<EquipmentStatus, string> = {
    Activos: "equipment_page.status_options.Activos",
    Operational: "equipment_page.status_options.Operational",
    In_Repair: "equipment_page.status_options.In-Repair",
    Needs_Calibration: "equipment_page.status_options.Needs_Calibration",
    Decommissioned: "equipment_page.status_options.Decommissioned",
  };
  return (
    keyMap[status] ||
    `equipment_page.status_options.${status.replace("_", " ")}`
  );
};

const EquipmentStatusBadge = ({ status }: { status: EquipmentStatus }) => {
  const { t } = useI18n();
  const statusClasses: Record<EquipmentStatus, string> = {
    Activos:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-600",
    Operational:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-600",
    In_Repair:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600",
    Needs_Calibration:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-600",
    Decommissioned:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-600",
  };

  return (
    <Badge className={cn("font-medium", statusClasses[status])}>
      {t(getStatusTranslationKey(status))}
    </Badge>
  );
};

const MaintenanceTypeBadge = ({ type }: { type: MaintenanceType }) => {
  if (!type) return null;

  const normalizedType = type
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const typeClasses: Record<string, string> = {
    preventivo:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-600",
    correctivo:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-600",
    predictivo:
      "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-600",
    otro: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-600",
  };

  const translationKey = `maintenance_dialog.categories.${normalizedType}`;

  return (
    <Badge className={cn("font-medium", typeClasses[normalizedType])}>
      <TranslatedText text={translationKey} />
    </Badge>
  );
};

interface SubRowContentProps {
  row: Row<Equipment>;
}

export function SubRowContent({ row }: SubRowContentProps) {
  const { t } = useI18n();
  const equipment = row.original;
  const [history, setHistory] = useState<EquipmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (row.getIsExpanded()) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        const historyData = await getHistoryForEquipment(equipment.id);
        setHistory(historyData);
        setHistoryLoading(false);
      };
      fetchHistory();
    }
  }, [row.getIsExpanded(), equipment.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-muted/50">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary">
            {t("equipment_page.details_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead>
                  {t("equipment_page.form.last_ext_calibration_label")}
                </TableHead>
                <TableCell>
                  <Badge variant="secondary">
                    {equipment.lastExternalCalibration
                      ? format(
                          parseISO(equipment.lastExternalCalibration),
                          "yyyy-MM-dd"
                        )
                      : "-"}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>
                  {t("equipment_page.form.next_ext_calibration_label")}
                </TableHead>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          {equipment.nextExternalCalibration
                            ? format(
                                parseISO(equipment.nextExternalCalibration),
                                "yyyy-MM-dd"
                              )
                            : "-"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("equipment_page.calculated_tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>
                  {t("equipment_page.form.periodicity_ext_calibration_label")}
                </TableHead>
                <TableCell>
                  {equipment.externalCalibrationPeriodicity}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>
                  {t("equipment_page.form.periodicity_int_check_label")}
                </TableHead>
                <TableCell>{equipment.internalCheckPeriodicity}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>{t("equipment_page.status")}</TableHead>
                <TableCell>
                  <EquipmentStatusBadge status={equipment.status} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary">
            {t("equipment_page.history_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead>
                    {t("equipment_page.history_columns.date")}
                  </TableHead>
                  <TableHead>
                    {t("equipment_page.history_columns.type")}
                  </TableHead>
                  <TableHead>
                    {t("equipment_page.history_columns.action")}
                  </TableHead>
                  <TableHead>
                    {t("equipment_page.history_columns.status")}
                  </TableHead>
                  <TableHead>
                    {t("equipment_page.history_columns.user")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("equipment_page.loading_history")}
                    </TableCell>
                  </TableRow>
                ) : history.length > 0 ? (
                  history.map((entry: EquipmentHistory, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(parseISO(entry.scheduledDate), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell>
                        <MaintenanceTypeBadge type={entry.maintenanceType} />
                      </TableCell>
                      <TableCell>
                        {/* Mostrar la acción traducida usando t y el dato real */}
                        {t(
                          `maintenance_dialog.types.${entry.action
                            .replace(/\s+/g, "_")
                            .toLowerCase()}`
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell>{entry.user}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("equipment_page.no_history_found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
