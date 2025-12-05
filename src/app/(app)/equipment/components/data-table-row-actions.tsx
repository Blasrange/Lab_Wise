"use client";

import { MoreHorizontal } from "lucide-react";
import type { CellContext } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function DataTableRowActions({ ...props }: CellContext<User, unknown>) {
  const { row, table } = props;
  const user = row.original as User;
  const { t } = useI18n();
  const meta = table.options.meta as {
    handleEdit: (user: User) => void;
    handlePasswordReset: (user: User) => void;
    handleToggleStatus: (user: User) => void;
  };

  const [dialogType, setDialogType] = useState<"reset" | "status" | null>(null);

  const isUserActive = user.status === "Active";

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => meta?.handleEdit(user)}>
            {t("users_page.row_actions.edit_profile")}
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDialogType("reset");
              }}
            >
              {t("users_page.row_actions.reset_password")}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDialogType("status");
              }}
              className={
                isUserActive
                  ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
                  : "text-green-600 focus:bg-green-100 focus:text-green-700"
              }
            >
              {isUserActive
                ? t("users_page.row_actions.deactivate_user")
                : t("users_page.row_actions.activate_user")}
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogType === "reset" && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("users_page.reset_password_dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("users_page.reset_password_dialog.description", {
                email: user.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogType(null)}>
              {t("equipment_page.form.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => meta?.handlePasswordReset(user)}>
              {t("users_page.reset_password_dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}

      {dialogType === "status" && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUserActive
                ? t("users_page.status_dialog.deactivate_title")
                : t("users_page.status_dialog.activate_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUserActive
                ? t("users_page.status_dialog.deactivate_description", {
                    name: user.name,
                  })
                : t("users_page.status_dialog.activate_description", {
                    name: user.name,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogType(null)}>
              {t("equipment_page.form.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => meta?.handleToggleStatus(user)}
              className={
                isUserActive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {isUserActive
                ? t("users_page.row_actions.deactivate_user")
                : t("users_page.row_actions.activate_user")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
