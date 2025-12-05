"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { User, UserRole, DocumentType } from "@/lib/types";
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
import { useI18n } from "@/lib/i18n/i18n-provider";
import { useEffect, useState, useMemo } from "react";
import { X, Check, Users, Eye, EyeOff, Loader } from "lucide-react";

const userSchema = (t: (key: string) => string, isEditing: boolean) =>
  z
    .object({
      name: z.string().min(1, t("users_page.form.name_label") + " is required"),
      email: z.string().email(t("users_page.form.email_label") + " is invalid"),
      password: z.string().optional(),
      documentType: z.enum(["CC", "TI", "CE", "Pasaporte"]),
      documentNumber: z
        .string()
        .min(1, t("users_page.form.document_number_label") + " is required"),
      role: z.enum(["Admin", "Supervisor", "Technician"]),
      status: z.enum(["Active", "Inactive"]),
    })
    .superRefine((data, ctx) => {
      if (
        !isEditing &&
        (data.role === "Admin" || data.role === "Supervisor") &&
        (!data.password || data.password.length < 6)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message:
            "Password must be at least 6 characters for Admin/Supervisor roles",
        });
      }
    });

type UserFormValues = z.infer<ReturnType<typeof userSchema>>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<User, "id" | "avatar">) => Promise<void>;
  user?: User | null;
  currentUserRole?: UserRole;
}

export function UserForm({
  isOpen,
  onClose,
  onSave,
  user,
  currentUserRole,
}: UserFormProps) {
  const { t } = useI18n();
  const isEditing = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema(t, isEditing)),
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        role: user.role,
        status: user.status,
      });
    } else if (isOpen && !user) {
      form.reset({
        name: "",
        email: "",
        password: "",
        documentType: "CC",
        documentNumber: "",
        role: "Technician",
        status: "Active",
      });
    }
  }, [user, isOpen, form]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSaving(true);
    try {
      if (isEditing && !data.password) {
        const { password, ...dataWithoutPassword } = data;
        await onSave(dataWithoutPassword as Omit<User, "id" | "avatar">);
      } else {
        await onSave(data as Omit<User, "id" | "avatar">);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const userRoleOptions = useMemo(() => {
    const allRoles: UserRole[] = ["Admin", "Supervisor", "Technician"];
    if (currentUserRole === "Supervisor") {
      return allRoles.filter((role) => role !== "Admin");
    }
    return allRoles;
  }, [currentUserRole]);

  const userStatusOptions: Array<"Active" | "Inactive"> = [
    "Active",
    "Inactive",
  ];
  const documentTypeOptions: DocumentType[] = ["CC", "TI", "CE", "Pasaporte"];

  const showPasswordField =
    !isEditing && (watchedRole === "Admin" || watchedRole === "Supervisor");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>
                {user
                  ? t("users_page.form.edit_title")
                  : t("users_page.form.add_title")}
              </DialogTitle>
              <DialogDescription>
                {user
                  ? t("users_page.form.edit_description")
                  : t("users_page.form.add_description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("users_page.form.name_label")}
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("users_page.form.email_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("users_page.form.role_label")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("users_page.form.role_placeholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`users_page.roles.${role.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showPasswordField && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">
                        {t("users_page.form.password_label")}
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("users_page.form.document_type_label")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "users_page.form.document_type_placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`users_page.document_types.${type}`)}
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
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      {t("users_page.form.document_number_label")}
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
                      {t("users_page.form.status_label")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "users_page.form.status_placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(
                              `users_page.status_options.${status.toLowerCase()}`
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
