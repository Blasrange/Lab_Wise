"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  Equipment,
  EquipmentHistory,
  NotificationSetting,
  User,
  MaintenanceType as MType,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  Wrench,
  SprayCan,
  Cog,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  User as UserIcon,
  FileText,
  Circle,
  Check,
  ChevronsUpDown,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { addMaintenanceToEquipment } from "@/services/historyService";
import { MOCK_NOTIFICATION_SETTINGS } from "@/lib/data";
import { addNotificationLog } from "@/services/notificationService";
import { sendEmail } from "@/ai/flows/send-email";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

type MaintenanceType = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: JSX.Element;
  category: MType;
};

const maintenanceSchema = (t: (key: string) => string, users: User[]) =>
  z.object({
    scheduledDate: z.date({
      required_error: t(
        "maintenance_dialog.form.validation.scheduled_date_required"
      ),
    }),
    completionDate: z.date().optional(),
    responsible:
      users.length > 0
        ? z
            .string()
            .min(
              1,
              t(
                "maintenance_dialog.form.validation.responsible_person_required"
              )
            )
        : z
            .string()
            .min(
              1,
              t(
                "maintenance_dialog.form.validation.responsible_person_required_manual"
              )
            ),
    priority: z.enum(["baja", "media", "alta"]),
    description: z
      .string()
      .min(1, t("maintenance_dialog.form.validation.description_required")),
    status: z.enum(["Programado", "En_Proceso", "Completado", "Cancelado"]),
  });

type MaintenanceFormValues = z.infer<ReturnType<typeof maintenanceSchema>>;

interface ScheduleMaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  onMaintenanceAdded: () => void;
  currentUser?: User;
  users: User[];
}

export function ScheduleMaintenanceDialog({
  isOpen,
  onClose,
  equipment,
  onMaintenanceAdded,
  currentUser,
  users,
}: ScheduleMaintenanceDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<MaintenanceType | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);

  const maintenanceTypes = useMemo(
    () => ({
      preventivo: [
        {
          id: "preventivo_rutinario",
          titleKey: "maintenance_dialog.types.preventive_routine_title",
          descriptionKey: "maintenance_dialog.types.preventive_routine_desc",
          icon: <Clock className="w-6 h-6" />,
          category: "Preventivo" as const,
        },
        {
          id: "preventivo_profundo",
          titleKey: "maintenance_dialog.types.preventive_deep_title",
          descriptionKey: "maintenance_dialog.types.preventive_deep_desc",
          icon: <Wrench className="w-6 h-6" />,
          category: "Preventivo" as const,
        },
        {
          id: "limpieza",
          titleKey: "maintenance_dialog.types.cleaning_title",
          descriptionKey: "maintenance_dialog.types.cleaning_desc",
          icon: <SprayCan className="w-6 h-6" />,
          category: "Preventivo" as const,
        },
        {
          id: "calibracion",
          titleKey: "maintenance_dialog.types.calibration_title",
          descriptionKey: "maintenance_dialog.types.calibration_desc",
          icon: <Cog className="w-6 h-6" />,
          category: "Predictivo" as const,
        },
      ],
      correctivo: [
        {
          id: "reparacion",
          titleKey: "maintenance_dialog.types.repair_title",
          descriptionKey: "maintenance_dialog.types.repair_desc",
          icon: <AlertTriangle className="w-6 h-6" />,
          category: "Correctivo" as const,
        },
      ],
      predictivo: [
        {
          id: "validacion",
          titleKey: "maintenance_dialog.types.validation_title",
          descriptionKey: "maintenance_dialog.types.validation_desc",
          icon: <CheckCircle className="w-6 h-6" />,
          category: "Predictivo" as const,
        },
      ],
    }),
    [t]
  );

  const priorityOptions = useMemo(
    () => [
      {
        value: "alta",
        label: t("maintenance_dialog.priorities.high"),
        color: "text-red-500",
      },
      {
        value: "media",
        label: t("maintenance_dialog.priorities.medium"),
        color: "text-yellow-500",
      },
      {
        value: "baja",
        label: t("maintenance_dialog.priorities.low"),
        color: "text-green-500",
      },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      {
        value: "Programado",
        label: t("maintenance_dialog.statuses.scheduled"),
        color: "text-blue-500",
      },
      {
        value: "En_Proceso",
        label: t("maintenance_dialog.statuses.in_progress"),
        color: "text-yellow-500",
      },
      {
        value: "Completado",
        label: t("maintenance_dialog.statuses.completed"),
        color: "text-green-500",
      },
      {
        value: "Cancelado",
        label: t("maintenance_dialog.statuses.canceled"),
        color: "text-red-500",
      },
    ],
    [t]
  );

  const technicians = useMemo(
    () => users.filter((user) => user.role === "Technician"),
    [users]
  );
  const hasTechnicians = technicians.length > 0;

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema(t, users)),
    defaultValues: {
      responsible: "",
      priority: "media",
      description: "",
      status: "Programado",
    },
  });

  const handleSelectType = (type: MaintenanceType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    form.reset();
    onClose();
  };

  const sendNotificationsForMaintenance = async (
    equipment: Equipment,
    maintenanceHistory: EquipmentHistory
  ) => {
    const activeSettings = MOCK_NOTIFICATION_SETTINGS.filter((s) => s.isActive);
    const maintenanceStatus = maintenanceHistory.status;

    for (const setting of activeSettings) {
      let shouldSend = false;
      let subject = "";
      let body = "";

      if (
        setting.type === "maintenance_reminder" &&
        maintenanceStatus === "Programado"
      ) {
        shouldSend = true;
        subject = `Recordatorio de Mantenimiento: ${equipment.instrument}`;
        body = `<p>Le recordamos que el equipo <strong>${equipment.instrument}</strong> (S/N: ${equipment.serialNumber}) tiene un mantenimiento programado.</p><p>Detalles: ${maintenanceHistory.action}</p><p>Fecha Programada: ${maintenanceHistory.scheduledDate}</p>`;
      } else if (
        setting.type === "maintenance_completed" &&
        maintenanceStatus === "Completado"
      ) {
        shouldSend = true;
        subject = `Mantenimiento Completado: ${equipment.instrument}`;
        body = `<p>El mantenimiento programado para el equipo <strong>${equipment.instrument}</strong> (S/N: ${equipment.serialNumber}) ha sido completado.</p><p>Detalles: ${maintenanceHistory.action}</p>`;
      }

      if (shouldSend) {
        const recipients = ["brangel@ccl.com.co"]; // Mock recipients from setting
        for (const recipient of recipients) {
          const emailResult = await sendEmail({
            to: recipient,
            subject: subject,
            html: body,
          });

          addNotificationLog({
            notificationType: setting.type,
            equipmentName: equipment.instrument,
            equipmentInternalCode: equipment.internalCode,
            subject: subject,
            recipients: [recipient],
            status: emailResult.success ? "Sent" : "Failed",
            error: emailResult.error,
          });
        }
      }
    }
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    if (!selectedType) return;

    const performingUser = currentUser?.name || "Mobile User";

    // Traducir el título antes de guardar
    const translatedAction = t(selectedType.titleKey);

    const newMaintenanceHistory: Omit<
      EquipmentHistory,
      "id" | "equipmentId" | "date"
    > = {
      action: translatedAction,
      maintenanceType: selectedType.category,
      status: data.status,
      responsible: data.responsible,
      priority: data.priority,
      scheduledDate: format(data.scheduledDate, "yyyy-MM-dd"),
      user: performingUser,
      description: data.description,
    };

    await addMaintenanceToEquipment(
      equipment.id,
      newMaintenanceHistory,
      performingUser,
      data.completionDate
        ? format(data.completionDate, "yyyy-MM-dd")
        : undefined
    );

    toast({
      variant: "success",
      title: t("maintenance_dialog.toast.success_title"),
      description: t("maintenance_dialog.toast.success_desc"),
    });

    if (onMaintenanceAdded) {
      onMaintenanceAdded();
    }
    handleClose();
  };

  const categoryStyles = {
    Preventivo: {
      bg: "bg-green-100/80 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      border: "hover:border-green-500",
      icon: "text-green-600",
    },
    Correctivo: {
      bg: "bg-amber-100/80 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "hover:border-amber-500",
      icon: "text-amber-600",
    },
    Predictivo: {
      bg: "bg-sky-100/80 dark:bg-sky-900/30",
      text: "text-sky-700 dark:text-sky-400",
      border: "hover:border-sky-500",
      icon: "text-sky-600",
    },
    Otro: {
      bg: "bg-gray-100/80 dark:bg-gray-900/30",
      text: "text-gray-700 dark:text-gray-400",
      border: "hover:border-gray-500",
      icon: "text-gray-600",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0">
        {step === 1 && (
          <>
            <DialogHeader className="p-4 sm:p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-md p-2">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {t("maintenance_dialog.step1.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {equipment.instrument} - {equipment.model}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="h-[60vh] sm:h-auto">
              <div className="p-4 sm:p-6 pt-0 space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  {t("maintenance_dialog.step1.description")}
                </p>

                {(
                  Object.keys(maintenanceTypes) as Array<
                    keyof typeof maintenanceTypes
                  >
                ).map((category) => (
                  <div key={category}>
                    <h3
                      className={cn(
                        "text-md font-semibold rounded-md px-3 py-1.5 capitalize",
                        categoryStyles[maintenanceTypes[category][0].category]
                          .bg,
                        categoryStyles[maintenanceTypes[category][0].category]
                          .text
                      )}
                    >
                      {t(`maintenance_dialog.categories.${category}`)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {maintenanceTypes[category].map((type) => (
                        <Card
                          key={type.id}
                          className={cn(
                            "p-3 flex items-start gap-3 hover:shadow-md transition-all cursor-pointer",
                            categoryStyles[type.category].border
                          )}
                          onClick={() => handleSelectType(type)}
                        >
                          <div
                            className={cn(
                              "mt-1",
                              categoryStyles[type.category].icon
                            )}
                          >
                            {type.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">
                              {t(type.titleKey)}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {t(type.descriptionKey)}
                            </CardDescription>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="bg-muted/60 p-3 flex-row justify-end">
              <Button variant="outline" onClick={handleClose}>
                <X className="mr-2 h-4 w-4" />
                {t("maintenance_dialog.buttons.cancel_step1")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && selectedType && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader
                className={cn(
                  "p-4 sm:p-6",
                  categoryStyles[selectedType.category].bg
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-md p-1.5",
                        categoryStyles[selectedType.category].icon
                      )}
                    >
                      {selectedType.icon}
                    </div>
                    <div>
                      <DialogTitle
                        className={cn(
                          "text-lg",
                          categoryStyles[selectedType.category].text
                        )}
                      >
                        {t(selectedType.titleKey)}
                      </DialogTitle>
                      <DialogDescription
                        className={cn(
                          categoryStyles[selectedType.category].text,
                          "opacity-80 text-xs"
                        )}
                      >
                        {equipment.instrument} - {equipment.model}
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="h-[70vh] sm:h-auto">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="flex-row items-center gap-2 space-y-0 p-3 border-b">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {t("maintenance_dialog.form.scheduling_title")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold text-red-500">
                                  {t(
                                    "maintenance_dialog.form.scheduled_date_label"
                                  )}{" "}
                                  *
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? (
                                          format(field.value, "dd/MM/yyyy")
                                        ) : (
                                          <span>
                                            {t("export_dialog.pick_a_date")}
                                          </span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
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
                            name="completionDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold">
                                  {t(
                                    "maintenance_dialog.form.completion_date_label"
                                  )}
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? (
                                          format(field.value, "dd/MM/yyyy")
                                        ) : (
                                          <span>
                                            {t("export_dialog.pick_a_date")}
                                          </span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
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
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex-row items-center gap-2 space-y-0 p-3 border-b">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {t("maintenance_dialog.form.responsibility_title")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          <FormField
                            control={form.control}
                            name="responsible"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold text-red-500">
                                  {t(
                                    "maintenance_dialog.form.responsible_person_label"
                                  )}{" "}
                                  *
                                </FormLabel>
                                {hasTechnicians ? (
                                  <Popover
                                    open={popoverOpen}
                                    onOpenChange={setPopoverOpen}
                                  >
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          {field.value
                                            ? technicians.find(
                                                (technician) =>
                                                  technician.name ===
                                                  field.value
                                              )?.name
                                            : t(
                                                "maintenance_dialog.form.responsible_person_placeholder"
                                              )}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                      <Command>
                                        <CommandInput
                                          placeholder={t(
                                            "maintenance_dialog.form.search_technician_placeholder"
                                          )}
                                        />
                                        <CommandList>
                                          <CommandEmpty>
                                            {t(
                                              "maintenance_dialog.form.no_technician_found"
                                            )}
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {technicians.map((technician) => (
                                              <CommandItem
                                                value={technician.name}
                                                key={technician.id}
                                                onSelect={() => {
                                                  form.setValue(
                                                    "responsible",
                                                    technician.name
                                                  );
                                                  setPopoverOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    technician.name ===
                                                      field.value
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                                {technician.name}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t(
                                        "maintenance_dialog.form.responsible_person_placeholder_manual"
                                      )}
                                    />
                                  </FormControl>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold">
                                  {t("maintenance_dialog.form.priority_label")}{" "}
                                  *
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t(
                                          "maintenance_dialog.form.priority_placeholder"
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {priorityOptions.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Circle
                                            className={cn(
                                              "w-3 h-3 fill-current",
                                              opt.color
                                            )}
                                          />
                                          <span>{opt.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                    <div className="space-y-4 flex flex-col">
                      <Card className="flex-grow">
                        <CardHeader className="flex-row items-center gap-2 space-y-0 p-3 border-b">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {t("maintenance_dialog.form.details_title")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-red-500">
                                  {t(
                                    "maintenance_dialog.form.description_label"
                                  )}{" "}
                                  *
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t(
                                      "maintenance_dialog.form.description_placeholder"
                                    )}
                                    {...field}
                                    rows={5}
                                  />
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
                                <FormLabel className="text-xs font-bold">
                                  {t("maintenance_dialog.form.status_label")}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t(
                                          "maintenance_dialog.form.status_placeholder"
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {statusOptions.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Circle
                                            className={cn(
                                              "w-3 h-3 fill-current",
                                              opt.color
                                            )}
                                          />
                                          <span>{opt.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="bg-muted/60 p-3 flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t("maintenance_dialog.buttons.cancel_step2")}
                </Button>
                <Button type="submit">
                  <Check className="mr-2 h-4 w-4" />
                  {t("maintenance_dialog.buttons.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
