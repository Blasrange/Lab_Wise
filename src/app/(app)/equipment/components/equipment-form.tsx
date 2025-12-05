"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Equipment, EquipmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { useEffect, useMemo, useState } from "react";
import {
  X,
  Check,
  ClipboardList,
  Circle,
  CalendarIcon,
  Loader,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const equipmentSchema = z.object({
  instrument: z.string().min(1, "Instrumento es requerido"),
  internalCode: z.string().min(1, "Código Interno es requerido"),
  brand: z.string().min(1, "Marca es requerida"),
  model: z.string().min(1, "Modelo es requerido"),
  serialNumber: z.string().min(1, "Número de serie es requerido"),
  systemNumber: z.string().min(1, "Número de sistema es requerido"),
  lastExternalCalibration: z.date({
    required_error: "Fecha requerida",
  }),
  nextExternalCalibration: z.date({
    required_error: "Fecha requerida",
  }),
  externalCalibrationPeriodicity: z.string().min(1, "Periodicidad requerida"),
  internalCheckPeriodicity: z.string().min(1, "Periodicidad requerida"),
  status: z.enum([
    "Operational",
    "In_Repair",
    "Needs_Calibration",
    "Decommissioned",
    "Activos",
  ]),
  imageUrl: z
    .string()
    .url({ message: "Por favor, ingrese una URL válida." })
    .optional()
    .or(z.literal("")),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  equipment?: Equipment | null;
}

export function EquipmentForm({
  isOpen,
  onClose,
  onSave,
  equipment,
}: EquipmentFormProps) {
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
  });

  const getStatusTranslationKey = useMemo(
    () =>
      (status: EquipmentStatus): string => {
        const keyMap: Record<EquipmentStatus, string> = {
          Activos: "equipment_page.status_options.Activos",
          Operational: "equipment_page.status_options.Operational",
          In_Repair: "equipment_page.status_options.In-Repair",
          Needs_Calibration: "equipment_page.status_options.Needs_Calibration",
          Decommissioned: "equipment_page.status_options.Decommissioned",
        };
        return keyMap[status] || `equipment_page.status_options.${status}`;
      },
    []
  );

  useEffect(() => {
    if (isOpen && equipment) {
      form.reset({
        instrument: equipment.instrument,
        internalCode: equipment.internalCode,
        brand: equipment.brand,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        systemNumber: equipment.systemNumber,
        lastExternalCalibration: new Date(equipment.lastExternalCalibration),
        nextExternalCalibration: new Date(equipment.nextExternalCalibration),
        externalCalibrationPeriodicity:
          equipment.externalCalibrationPeriodicity,
        internalCheckPeriodicity: equipment.internalCheckPeriodicity,
        status: equipment.status,
        imageUrl: equipment.imageUrl,
      });
    } else if (isOpen && !equipment) {
      form.reset({
        instrument: "",
        internalCode: "",
        brand: "",
        model: "",
        serialNumber: "",
        systemNumber: "",
        lastExternalCalibration: new Date(),
        nextExternalCalibration: new Date(),
        externalCalibrationPeriodicity: "",
        internalCheckPeriodicity: "",
        status: "Activos",
        imageUrl: "",
      });
    }
  }, [equipment, isOpen, form]);

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsSaving(true);
    try {
      await onSave({
        ...equipment,
        ...data,
        lastExternalCalibration: format(
          data.lastExternalCalibration,
          "yyyy-MM-dd"
        ),
        nextExternalCalibration: format(
          data.nextExternalCalibration,
          "yyyy-MM-dd"
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const equipmentStatusOptions: EquipmentStatus[] = [
    "Activos",
    "Operational",
    "In_Repair",
    "Needs_Calibration",
    "Decommissioned",
  ];

  const statusColorClasses: Record<EquipmentStatus, string> = {
    Activos: "text-green-500",
    Operational: "text-green-500",
    In_Repair: "text-yellow-500",
    Needs_Calibration: "text-orange-500",
    Decommissioned: "text-gray-500",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>
                {equipment
                  ? t("equipment_page.form.edit_title")
                  : t("equipment_page.form.add_title")}
              </DialogTitle>
              <DialogDescription>
                {equipment
                  ? t("equipment_page.form.edit_description")
                  : t("equipment_page.form.add_description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.instrument")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.internalCode")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.brand")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.model")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.serialNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.columns.systemNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastExternalCalibration"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-bold">
                      {t("equipment_page.form.last_ext_calibration_label")}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>{t("export_dialog.pick_a_date")}</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextExternalCalibration"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-bold">
                      {t("equipment_page.form.next_ext_calibration_label")}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>{t("export_dialog.pick_a_date")}</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="externalCalibrationPeriodicity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t(
                        "equipment_page.form.periodicity_ext_calibration_label"
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalCheckPeriodicity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.form.periodicity_int_check_label")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.form.status_label")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "equipment_page.form.status_placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {equipmentStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <Circle
                                className={cn(
                                  "w-3 h-3 fill-current",
                                  statusColorClasses[status]
                                )}
                              />
                              <span>{t(getStatusTranslationKey(status))}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("equipment_page.form.image_url_label")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          className="pl-10"
                          placeholder={t(
                            "equipment_page.form.image_url_placeholder"
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                {t("equipment_page.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isSaving
                  ? t("equipment_page.form.saving")
                  : t("equipment_page.form.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
