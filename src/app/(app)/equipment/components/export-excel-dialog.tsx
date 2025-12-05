"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileSpreadsheet,
  X,
  Download,
  Info,
  CalendarIcon,
  ListChecks,
  FileDown,
  Loader,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { Equipment, EquipmentHistory, NotificationLog } from "@/lib/types";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  exportEquipmentHistoryToExcel,
  exportNotificationLogsToExcel,
} from "@/lib/exportUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getHistoryForEquipment } from "@/services/historyService";

interface ExportExcelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: "equipment" | "notifications";
  equipmentData?: Equipment[];
  notificationData?: NotificationLog[];
}

export function ExportExcelDialog({
  isOpen,
  onClose,
  exportType,
  equipmentData = [],
  notificationData = [],
}: ExportExcelDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeRange, setActiveRange] = useState<string>("30");
  const [allHistory, setAllHistory] = useState<EquipmentHistory[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (exportType === "equipment" && isOpen) {
      const fetchAllHistory = async () => {
        const historyPromises = equipmentData.map((eq) =>
          getHistoryForEquipment(eq.id)
        );
        const historyResults = await Promise.all(historyPromises);
        setAllHistory(historyResults.flat());
      };
      fetchAllHistory();
    }
  }, [isOpen, exportType, equipmentData]);

  const setRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
    setActiveRange(days.toString());
  };

  const setYearRange = () => {
    setDateRange({
      from: subDays(new Date(), 365),
      to: new Date(),
    });
    setActiveRange("365");
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      if (exportType === "equipment") {
        const filteredHistory = allHistory.filter((item) => {
          const itemDate = new Date(item.date);
          const fromDate = dateRange.from
            ? new Date(dateRange.from.setHours(0, 0, 0, 0))
            : null;
          const toDate = dateRange.to
            ? new Date(dateRange.to.setHours(23, 59, 59, 999))
            : null;
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          return true;
        });
        exportEquipmentHistoryToExcel(equipmentData, filteredHistory, t);
      } else if (exportType === "notifications") {
        const filteredLogs = notificationData.filter((item) => {
          const itemDate = new Date(item.sentAt);
          const fromDate = dateRange.from
            ? new Date(dateRange.from.setHours(0, 0, 0, 0))
            : null;
          const toDate = dateRange.to
            ? new Date(dateRange.to.setHours(23, 59, 59, 999))
            : null;
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          return true;
        });
        exportNotificationLogsToExcel(filteredLogs, t);
      }

      toast({
        variant: "success",
        title: t("export_dialog.toast.success_title"),
        description: t("export_dialog.toast.success_desc"),
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const rangeButtons = [
    { label: t("export_dialog.ranges.last_7_days"), days: 7 },
    { label: t("export_dialog.ranges.last_30_days"), days: 30 },
    { label: t("export_dialog.ranges.last_3_months"), days: 90 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("export_dialog.title")}</DialogTitle>
              <DialogDescription>
                {t("export_dialog.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-md">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <CardTitle>{t("import_page.instructions_title")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("export_dialog.info_alert")}
                  </AlertDescription>
                </Alert>
                <Alert
                  variant="default"
                  className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mt-4"
                >
                  <Info className="h-4 w-4 !text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">
                    {t("export_dialog.report_content_title")}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    {t("export_dialog.report_content_desc")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("export_dialog.select_range_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {t("export_dialog.quick_ranges")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rangeButtons.map(({ label, days }) => (
                      <Button
                        key={days}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "transition-all",
                          activeRange === days.toString() &&
                            "bg-secondary text-secondary-foreground"
                        )}
                        onClick={() => setRange(days)}
                      >
                        {label}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "transition-all",
                        activeRange === "365" &&
                          "bg-secondary text-secondary-foreground"
                      )}
                      onClick={setYearRange}
                    >
                      {t("export_dialog.ranges.last_year")}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      {t("export_dialog.start_date")}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "dd/MM/yyyy")
                          ) : (
                            <span>{t("export_dialog.pick_a_date")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(from) => {
                            setDateRange((prev) => ({ ...prev, from }));
                            setActiveRange("");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      {t("export_dialog.end_date")}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "dd/MM/yyyy")
                          ) : (
                            <span>{t("export_dialog.pick_a_date")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(to) => {
                            setDateRange((prev) => ({ ...prev, to }));
                            setActiveRange("");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            <X className="mr-2 h-4 w-4" />
            {t("equipment_page.form.cancel")}
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading
              ? t("export_dialog.downloading_button")
              : t("export_dialog.download_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
