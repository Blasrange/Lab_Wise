"use client";

import type { User, UserRole } from "@/lib/types";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "../../equipment/components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const { t } = useI18n();
      return (
        <DataTableColumnHeader
          column={column}
          title={t("users_page.columns.user")}
        />
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "document",
    header: ({ column }) => {
      const { t } = useI18n();
      return (
        <DataTableColumnHeader
          column={column}
          title={t("users_page.columns.document")}
          className="justify-center"
        />
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col items-center">
          <span className="font-medium">{user.documentNumber}</span>
          <p className="text-xs text-muted-foreground">{user.documentType}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      const { t } = useI18n();
      return (
        <DataTableColumnHeader
          column={column}
          title={t("users_page.columns.role")}
          className="justify-center"
        />
      );
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const role = row.getValue("role") as UserRole;
      const roleTranslations: Record<UserRole, string> = {
        Admin: t("users_page.roles.admin"),
        Supervisor: t("users_page.roles.supervisor"),
        Technician: t("users_page.roles.technician"),
      };
      const roleClassMap: Record<UserRole, string> = {
        Admin:
          "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700",
        Supervisor:
          "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
        Technician:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
      };
      return (
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={cn("capitalize", roleClassMap[role])}
          >
            {roleTranslations[role]}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      const { t } = useI18n();
      return (
        <DataTableColumnHeader
          column={column}
          title={t("users_page.columns.status")}
          className="justify-center"
        />
      );
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const status = row.getValue("status") as string;
      const statusTranslations = {
        Active: t("users_page.status_options.active"),
        Inactive: t("users_page.status_options.inactive"),
      };

      return (
        <div className="flex justify-center">
          <Badge
            className={cn(
              "w-24 justify-center capitalize",
              status === "Active"
                ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300"
            )}
          >
            {status === "Active"
              ? statusTranslations.Active
              : statusTranslations.Inactive}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: (props) => <DataTableRowActions {...props} />,
  },
];
