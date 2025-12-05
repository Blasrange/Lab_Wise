"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { NotificationSetting } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { Settings, Save, X, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = (t: (key: string) => string) =>
  z.object({
    isActive: z.boolean(),
    daysBefore: z.coerce
      .number()
      .min(0, t("notification_settings_dialog.validation.days_non_negative")),
    recipients: z
      .array(
        z.object({
          email: z
            .string()
            .email(t("notification_settings_dialog.validation.invalid_email")),
        })
      )
      .min(
        1,
        t("notification_settings_dialog.validation.at_least_one_recipient")
      ),
  });

type SettingsFormValues = z.infer<ReturnType<typeof settingsSchema>>;

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setting: NotificationSetting, data: SettingsFormValues) => void;
  setting: NotificationSetting | null;
}

export function NotificationSettingsDialog({
  isOpen,
  onClose,
  onSave,
  setting,
}: NotificationSettingsDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [showAddEmail, setShowAddEmail] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema(t)),
    defaultValues: {
      isActive: false,
      daysBefore: 0,
      recipients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recipients",
  });

  useEffect(() => {
    if (setting) {
      form.reset({
        isActive: setting.isActive,
        daysBefore: setting.daysBefore,
        recipients: setting.recipients.map((email) => ({ email })),
      });
    }
  }, [setting, form]);

  const handleAddRecipient = () => {
    if (newEmail.trim() !== "") {
      const emailSchema = z.string().email({
        message: t("notification_settings_dialog.validation.invalid_email"),
      });
      const result = emailSchema.safeParse(newEmail);
      if (result.success) {
        append({ email: newEmail });
        setNewEmail("");
        setShowAddEmail(false);
      } else {
        toast({
          variant: "destructive",
          title: t("notification_settings_dialog.toast.invalid_email_title"),
          description: result.error.errors[0].message,
        });
      }
    }
  };

  const onSubmit = (data: SettingsFormValues) => {
    if (setting) {
      onSave(setting, data);
    }
  };

  if (!setting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("notification_settings_dialog.title")}</DialogTitle>
          <DialogDescription>{t(setting.title)}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">
                    {t("notification_settings_dialog.active_label")}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daysBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("notification_settings_dialog.days_before_label")}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("notification_settings_dialog.days_before_desc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>
                {t("notification_settings_dialog.recipients_label")}
              </FormLabel>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      {...form.register(`recipients.${index}.email` as const)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {showAddEmail ? (
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t(
                      "notification_settings_dialog.add_recipient_placeholder"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleAddRecipient}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => setShowAddEmail(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("notification_settings_dialog.add_button")}
                </Button>
              )}
              <FormMessage>
                {form.formState.errors.recipients?.message}
              </FormMessage>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                {t("equipment_page.form.cancel")}
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {t("equipment_page.form.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
