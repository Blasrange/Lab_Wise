"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Equipment } from "@/lib/types";
import {
  Upload,
  Info,
  Download,
  FileSpreadsheet,
  X,
  Check,
  FileUp,
  Edit,
  PlusCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExcelRow = Omit<
  Equipment,
  | "id"
  | "imageUrl"
  | "imageHint"
  | "qrToken"
  | "nextMaintenance"
  | "nextCalibration"
  | "purchaseDate"
  | "lastMaintenance"
  | "lastCalibration"
  | "notes"
>;

interface ImportExcelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  equipmentList: Equipment[];
}

export function ImportExcelDialog({
  isOpen,
  onClose,
  onImport,
  equipmentList,
}: ImportExcelDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const analysis = useMemo(() => {
    if (data.length === 0) {
      return { toCreate: 0, toUpdate: 0 };
    }
    const existingCodes = new Set(equipmentList.map((eq) => eq.internalCode));
    let toCreate = 0;
    let toUpdate = 0;
    data.forEach((row) => {
      if (existingCodes.has(row.internalCode)) {
        toUpdate++;
      } else {
        toCreate++;
      }
    });
    return { toCreate, toUpdate };
  }, [data, equipmentList]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        droppedFile.type === "application/vnd.ms-excel"
      ) {
        processFile(droppedFile);
      } else {
        toast({
          variant: "destructive",
          title: t("import_page.errors.invalid_file_title"),
          description: t("import_page.errors.invalid_file_desc"),
        });
      }
      e.dataTransfer.clearData();
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      if (bstr) {
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const rows = jsonData
          .slice(1)
          .filter(
            (row) =>
              Array.isArray(row) &&
              row.length > 0 &&
              row.some((cell) => cell !== null && cell !== "")
          );

        const formattedData: any[] = rows.map((row: any) => ({
          instrument: row[0] || "",
          internalCode: row[1] || "",
          brand: row[2] || "",
          model: row[3] || "",
          serialNumber: row[4] || "",
          systemNumber: row[5] || "",
          lastExternalCalibration:
            row[6] instanceof Date
              ? row[6].toISOString().split("T")[0]
              : row[6] || "",
          nextExternalCalibration:
            row[7] instanceof Date
              ? row[7].toISOString().split("T")[0]
              : row[7] || "",
          externalCalibrationPeriodicity: row[8] || "",
          internalCheckPeriodicity: row[9] || "",
          status: "Activos",
        }));
        setData(formattedData);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      t("equipment_page.columns.instrument"),
      t("equipment_page.columns.internalCode"),
      t("equipment_page.columns.brand"),
      t("equipment_page.columns.model"),
      t("equipment_page.columns.serialNumber"),
      t("equipment_page.columns.systemNumber"),
      t("equipment_page.form.last_ext_calibration_label"),
      t("equipment_page.form.next_ext_calibration_label"),
      t("equipment_page.form.periodicity_ext_calibration_label"),
      t("equipment_page.form.periodicity_int_check_label"),
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("import_page.template_sheet_name"));
    XLSX.writeFile(wb, "Equipment_Import_Template.xlsx");
    toast({
      variant: "success",
      title: t("import_page.toast.template_download_title"),
      description: t("import_page.toast.template_download_desc"),
    });
  };

  const handleImportClick = async () => {
    setIsImporting(true);
    try {
      await onImport(data);
      handleClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("import_page.title")}</DialogTitle>
              <DialogDescription>
                {t("import_page.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-md">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <CardTitle>{t("import_page.instructions_title")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("import_page.info_alert")}
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("import_page.download_template")}
                </Button>

                <div
                  className={cn(
                    "relative mt-4 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                  onDragEnter={handleDragEvents}
                  onDragOver={handleDragEvents}
                  onDragLeave={handleDragEvents}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("file-upload-dialog")?.click()
                  }
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground">
                      <span className="font-semibold">
                        {t("import_page.drag_drop_text_1")}
                      </span>{" "}
                      {t("import_page.drag_drop_text_2")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("import_page.file_types")}
                    </p>
                  </div>
                  <input
                    id="file-upload-dialog"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("import_page.preview_title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {file?.name || t("import_page.preview_desc")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[35vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead>
                          {t("equipment_page.columns.instrument")}
                        </TableHead>
                        <TableHead>
                          {t("equipment_page.columns.internalCode")}
                        </TableHead>
                        <TableHead>
                          {t("equipment_page.columns.brand")}
                        </TableHead>
                        <TableHead>
                          {t("equipment_page.columns.model")}
                        </TableHead>
                        <TableHead>
                          {t("equipment_page.columns.serialNumber")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length > 0 ? (
                        data.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.instrument}</TableCell>
                            <TableCell>{row.internalCode}</TableCell>
                            <TableCell>{row.brand}</TableCell>
                            <TableCell>{row.model}</TableCell>
                            <TableCell>{row.serialNumber}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            {file
                              ? t("import_page.no_data_preview")
                              : t("import_page.upload_to_preview")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            {data.length > 0 && (
              <Card>
                <CardContent className="p-4 flex justify-around">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-green-600">
                      <PlusCircle className="h-6 w-6" />
                      <p className="text-2xl font-bold">{analysis.toCreate}</p>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("import_page.to_create")}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Edit className="h-6 w-6" />
                      <p className="text-2xl font-bold">{analysis.toUpdate}</p>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("import_page.to_update")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            <X className="mr-2 h-4 w-4" />
            {t("equipment_page.form.cancel")}
          </Button>
          <Button
            onClick={handleImportClick}
            disabled={data.length === 0 || isImporting}
          >
            {isImporting ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isImporting
              ? t("import_page.importing_button_text")
              : `${t("import_page.import_button_text")} (${data.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
