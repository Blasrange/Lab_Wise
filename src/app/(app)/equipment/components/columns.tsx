"use client";

import type { Equipment } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  ChevronDown,
  Wrench,
  Clock,
  QrCode,
  Pencil,
  KeyRound,
  Power,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./data-table-column-header";
import { useI18n } from "@/lib/i18n/i18n-provider";

type ActionsProps = {
  onEdit: (equipment: Equipment) => void;
  onScheduleMaintenance: (equipment: Equipment) => void;
  onViewHistory: (equipment: Equipment) => void;
  onGenerateQr: (equipment: Equipment) => void;
};

export const useColumns = ({
  onEdit,
  onScheduleMaintenance,
  onViewHistory,
  onGenerateQr,
}: ActionsProps): ColumnDef<Equipment>[] => {
  const { t } = useI18n();

  return [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            {...{
              onClick: row.getToggleExpandedHandler(),
              style: { cursor: "pointer" },
            }}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                row.getIsExpanded() ? "rotate-180" : ""
              }`}
            />
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: "instrument",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.instrument")}
        />
      ),
    },
    {
      accessorKey: "internalCode",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.internalCode")}
        />
      ),
    },
    {
      accessorKey: "brand",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.brand")}
        />
      ),
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.model")}
        />
      ),
    },
    {
      accessorKey: "serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.serialNumber")}
        />
      ),
    },
    {
      accessorKey: "systemNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("equipment_page.columns.systemNumber")}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const equipment = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t("equipment_page.row_actions.actions_label")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(equipment)}>
                  <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{t("equipment_page.row_actions.edit")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onScheduleMaintenance(equipment)}
                >
                  <Wrench className="mr-2 h-4 w-4 text-orange-500" />
                  <span>
                    {t("equipment_page.row_actions.schedule_maintenance")}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewHistory(equipment)}>
                  <Clock className="mr-2 h-4 w-4 text-purple-500" />
                  <span>{t("equipment_page.row_actions.view_history")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateQr(equipment)}>
                  <QrCode className="mr-2 h-4 w-4 text-green-500" />
                  <span>{t("equipment_page.row_actions.generate_qr")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
