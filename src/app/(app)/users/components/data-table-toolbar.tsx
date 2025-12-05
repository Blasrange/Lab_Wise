"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { roles, statuses } from "../data/data";
import { DataTableFacetedFilter } from "../../equipment/components/data-table-faceted-filter";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const { t } = useI18n();
  const isFiltered = table.getState().columnFilters.length > 0;

  const roleOptions = [
    { value: "Admin", label: t("users_page.roles.admin") },
    { value: "Supervisor", label: t("users_page.roles.supervisor") },
    { value: "Technician", label: t("users_page.roles.technician") },
  ];

  const statusOptions = [
    { value: "Active", label: t("users_page.status_options.active") },
    { value: "Inactive", label: t("users_page.status_options.inactive") },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t("equipment_page.filter_placeholder")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title={t("users_page.columns.role")}
            options={roleOptions}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title={t("users_page.columns.status")}
            options={statusOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {t("equipment_page.reset")}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
