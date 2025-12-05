"use client";

import { X } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  historyStatusFilter: Set<string>;
  onHistoryStatusChange: (values: Set<string>) => void;
}

export function DataTableToolbar<TData>({
  table,
  historyStatusFilter,
  onHistoryStatusChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || historyStatusFilter.size > 0;
  const { t } = useI18n();

  const statuses = [
    {
      value: "Programado",
      label: t("equipment_page.history_status.Programado"),
    },
    {
      value: "En_Proceso",
      label: t("equipment_page.history_status.En Proceso"),
    },
    {
      value: "Completado",
      label: t("equipment_page.history_status.Completado"),
    },
    { value: "Cancelado", label: t("equipment_page.history_status.Cancelado") },
  ];

  const handleReset = () => {
    table.resetColumnFilters();
    onHistoryStatusChange(new Set());
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t("equipment_page.filter_placeholder")}
          value={
            (table.getColumn("instrument")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("instrument")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <DataTableFacetedFilter
          title={t("equipment_page.status")}
          options={statuses}
          selectedValues={historyStatusFilter}
          onFilterChange={onHistoryStatusChange}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            {t("equipment_page.reset")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
