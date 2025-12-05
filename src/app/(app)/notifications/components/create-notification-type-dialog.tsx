"use client";

import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { Save, X, BellPlus, Loader } from "lucide-react";
import { useEffect, useState } from "react";

const createTypeSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().min(1, "La descripción es requerida"),
  });

type FormValues = z.infer<ReturnType<typeof createTypeSchema>>;

interface CreateNotificationTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<
      NotificationSetting,
      "id" | "type" | "recipients" | "isActive" | "daysBefore"
    >
  ) => Promise<void>;
}

export function CreateNotificationTypeDialog({
  isOpen,
  onClose,
  onSave,
}: CreateNotificationTypeDialogProps) {
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createTypeSchema(t)),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsSaving(false);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <BellPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("create_type.new_notification")}</DialogTitle>
              <DialogDescription>
                {t("create_type.new_type_of_notification")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_type.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("create_type.title_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_type.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("create_type.description_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <Save className="mr-2 h-4 w-4" />
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
