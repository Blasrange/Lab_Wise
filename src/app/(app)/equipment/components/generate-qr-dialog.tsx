"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Equipment } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { QRCodeCanvas } from "qrcode.react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QrCode,
  Download,
  Printer,
  X,
  Info,
  FileText,
  Smartphone,
  List,
  CheckSquare,
  Edit,
  PlusCircle,
  Loader,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface GenerateQrDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
}

export function GenerateQrDialog({
  isOpen,
  onClose,
  equipment,
}: GenerateQrDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState<null | "download" | "print">(
    null
  );

  const qrUrl = equipment.qrToken
    ? `${window.location.origin}/m/${equipment.qrToken}`
    : "";

  const downloadQR = () => {
    setIsProcessing("download");
    setTimeout(() => {
      // Simulate processing time
      const canvas = qrRef.current?.querySelector("canvas");
      if (canvas) {
        const pngUrl = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${equipment.instrument}-qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast({
          variant: "success",
          title: t("qr_dialog.toast.download_success_title"),
          description: t("qr_dialog.toast.download_success_desc"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("qr_dialog.errors.download_title"),
          description: t("qr_dialog.errors.download_desc"),
        });
      }
      setIsProcessing(null);
    }, 500);
  };

  const printQR = () => {
    setIsProcessing("print");
    setTimeout(() => {
      // Simulate processing time
      const canvas = qrRef.current?.querySelector("canvas");
      if (canvas) {
        const printWindow = window.open("", "", "height=600,width=800");
        printWindow?.document.write("<html><head><title>Print QR Code</title>");
        printWindow?.document.write("</head><body >");
        printWindow?.document.write(`<h2>${equipment.instrument}</h2>`);
        printWindow?.document.write(
          '<img src="' +
            canvas.toDataURL() +
            '" style="max-width: 300px; margin-top: 20px;" />'
        );
        printWindow?.document.write("</body></html>");
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => {
          printWindow?.print();
          printWindow?.close();
        }, 250);
        toast({
          variant: "success",
          title: t("qr_dialog.toast.print_success_title"),
          description: t("qr_dialog.toast.print_success_desc"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("qr_dialog.errors.print_title"),
          description: t("qr_dialog.errors.print_desc"),
        });
      }
      setIsProcessing(null);
    }, 500);
  };

  const handleManageTasks = () => {
    if (qrUrl) {
      window.open(qrUrl, "_blank");
    }
  };

  const instructions = [
    {
      icon: <Smartphone className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
      text: t("qr_dialog.instructions.item1"),
    },
    {
      icon: <List className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
      text: t("qr_dialog.instructions.item2"),
    },
    {
      icon: (
        <CheckSquare className="h-4 w-4 text-blue-700 dark:text-blue-300" />
      ),
      text: t("qr_dialog.instructions.item3"),
    },
    {
      icon: <Edit className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
      text: t("qr_dialog.instructions.item4"),
    },
    {
      icon: <PlusCircle className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
      text: t("qr_dialog.instructions.item5"),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>
                {t("qr_dialog.title")} - {equipment.instrument}
              </DialogTitle>
              <DialogDescription>
                {equipment.brand} {equipment.model} - S/N:{" "}
                {equipment.serialNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <Card>
            <CardHeader className="items-center">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Smartphone />
                <span>{t("qr_dialog.scan_title")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-2">
              <div className="relative w-[220px] h-[220px] mb-4">
                <Image
                  src={equipment.imageUrl}
                  alt={equipment.instrument}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
              <div ref={qrRef} className="bg-white p-4 rounded-lg border">
                {qrUrl ? (
                  <QRCodeCanvas value={qrUrl} size={220} />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 text-sm text-muted-foreground">
                    {t("qr_dialog.generating")}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("qr_dialog.scan_subtitle")}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileText />
                  <span>{t("qr_dialog.equipment_info_title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <strong className="text-muted-foreground">
                    {t("equipment_page.columns.instrument")}:
                  </strong>
                  <span>{equipment.instrument}</span>
                  <strong className="text-muted-foreground">
                    {t("equipment_page.columns.internalCode")}:
                  </strong>
                  <span className="text-primary font-semibold">
                    {equipment.internalCode}
                  </span>
                  <strong className="text-muted-foreground">
                    {t("equipment_page.columns.brand")}:
                  </strong>
                  <span>{equipment.brand}</span>
                  <strong className="text-muted-foreground">
                    {t("equipment_page.columns.model")}:
                  </strong>
                  <span>{equipment.model}</span>
                </div>
              </CardContent>
            </Card>

            <Alert
              variant="default"
              className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            >
              <Info className="h-4 w-4 !text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                {t("qr_dialog.instructions_title")}
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <ul className="mt-2 space-y-1.5">
                  {instructions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-0.5">{item.icon}</div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between flex-row-reverse w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={!!isProcessing}
          >
            <X className="mr-2 h-4 w-4" />
            {t("equipment_page.form.cancel")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
              onClick={handleManageTasks}
              disabled={!!isProcessing}
            >
              <List className="mr-2 h-4 w-4" />
              {t("qr_dialog.buttons.manage_tasks")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
              onClick={downloadQR}
              disabled={!!isProcessing}
            >
              {isProcessing === "download" ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t("qr_dialog.buttons.download")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
              onClick={printQR}
              disabled={!!isProcessing}
            >
              {isProcessing === "print" ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {t("qr_dialog.buttons.print")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
