"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { smartAlert, type SmartAlertOutput } from "@/ai/flows/smart-alerting";
import { getHistoryForEquipment } from "@/services/historyService";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Equipment, EquipmentHistory, User } from "@/lib/types";
import {
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  Info,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { addActivityLog } from "@/services/activityLogService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const FormSchema = z.object({
  equipmentId: z
    .string()
    .min(1, { message: "Please select a piece of equipment." }),
});

type SmartAlertToolProps = {
  equipmentList: Equipment[];
};

export function SmartAlertTool({ equipmentList }: SmartAlertToolProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartAlertOutput | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const activeEquipment = useMemo(
    () =>
      equipmentList.filter(
        (e) => e.status === "Activos" || e.status === "Operational"
      ),
    [equipmentList]
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { equipmentId: "" },
  });

  const getMaintenanceCategory = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("reparación")) return "correctivo";
    if (lowerAction.includes("calibraci") || lowerAction.includes("validaci"))
      return "predictivo";
    return "preventivo";
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);

    const selectedEquipment = equipmentList.find(
      (e) => e.id === data.equipmentId
    );
    if (!selectedEquipment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected equipment not found.",
      });
      setIsLoading(false);
      return;
    }

    const history = await getHistoryForEquipment(selectedEquipment.id);

    const maintenanceCounts = history.reduce((acc, item) => {
      const category = getMaintenanceCategory(item.action);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const equipmentDataString = `
      Name: ${selectedEquipment.instrument}, Model: ${selectedEquipment.model}
      Status: ${selectedEquipment.status}
      Last Calibration: ${selectedEquipment.lastExternalCalibration}
      Next Calibration: ${selectedEquipment.nextExternalCalibration}
      Maintenance History: 
      - Preventive tasks: ${maintenanceCounts["preventivo"] || 0}
      - Corrective tasks: ${maintenanceCounts["correctivo"] || 0}
      - Predictive tasks: ${maintenanceCounts["predictivo"] || 0}
    `;

    try {
      const response = await smartAlert({
        equipmentData: equipmentDataString,
        language: locale,
      });
      setResult(response);
    } catch (error) {
      console.error("AI Smart Alert Error:", error);
      if (user) {
        addActivityLog({
          user: user.name,
          actionType: "SYSTEM_ERROR",
          description: "AI Smart Alert analysis failed.",
          details: {
            context: "Smart Alert Tool",
            equipmentId: selectedEquipment.id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      toast({
        variant: "destructive",
        title: t("dashboard.smart_alert_tool.error_title"),
        description: t("dashboard.smart_alert_tool.error_description"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const UrgencyBadge = ({
    urgency,
  }: {
    urgency: SmartAlertOutput["urgency"];
  }) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline",
    } as const;
    const icons = {
      high: <AlertTriangle className="mr-1" />,
      medium: <Lightbulb className="mr-1" />,
      low: <Info className="mr-1" />,
    } as const;
    const urgencyText = {
      high: t("dashboard.smart_alert_tool.high"),
      medium: t("dashboard.smart_alert_tool.medium"),
      low: t("dashboard.smart_alert_tool.low"),
    };
    return (
      <Badge
        variant={variants[urgency]}
        className="capitalize text-sm py-1 px-3"
      >
        {icons[urgency]} {urgencyText[urgency]}
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>{t("dashboard.smart_alert_tool.title")}</CardTitle>
            <CardDescription>
              {t("dashboard.smart_alert_tool.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {t("dashboard.smart_alert_tool.select_equipment")}
                  </FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value
                            ? activeEquipment.find(
                                (equipment) => equipment.id === field.value
                              )?.instrument
                            : t(
                                "dashboard.smart_alert_tool.select_placeholder"
                              )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t(
                            "dashboard.smart_alert_tool.search_placeholder"
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("dashboard.smart_alert_tool.no_equipment_found")}
                          </CommandEmpty>
                          <CommandGroup>
                            {activeEquipment.map((equipment) => (
                              <CommandItem
                                value={equipment.instrument}
                                key={equipment.id}
                                onSelect={() => {
                                  form.setValue("equipmentId", equipment.id);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    equipment.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {equipment.instrument}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isLoading && (
              <div className="space-y-4 pt-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            )}
            {result && (
              <Alert className="mt-4 border-primary/50 bg-primary/5">
                <Lightbulb className="h-4 w-4 !text-primary" />
                <AlertTitle className="flex items-center justify-between">
                  <span>
                    {t("dashboard.smart_alert_tool.recommendation_title")}
                  </span>
                  <UrgencyBadge urgency={result.urgency} />
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="font-semibold">{result.recommendation}</p>
                  <p className="text-muted-foreground">{result.explanation}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t("dashboard.smart_alert_tool.analyzing")
                : t("dashboard.smart_alert_tool.run_analysis")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
