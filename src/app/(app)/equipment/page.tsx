"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp, FileDown } from "lucide-react";
import { useColumns } from "./components/columns";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { EquipmentForm } from "./components/equipment-form";
import type {
  Equipment,
  EquipmentHistory,
  MaintenanceStatus,
  EquipmentStatus,
  User,
} from "@/lib/types";
import {
  getEquipments,
  addEquipment,
  updateEquipment,
  deleteEquipment as deleteEquipmentService,
  getEquipmentByInternalCode,
} from "@/services/equipmentService";
import { getHistoryForEquipment } from "@/services/historyService";
import { getUsers } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { ViewHistoryDialog } from "./components/view-history-dialog";
import { ScheduleMaintenanceDialog } from "./components/schedule-maintenance-dialog";
import { GenerateQrDialog } from "./components/generate-qr-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { DataTablePagination } from "./components/data-table-pagination";
import { ImportExcelDialog } from "./components/import-excel-dialog";
import { ExportExcelDialog } from "./components/export-excel-dialog";
import { useAuth } from "@/hooks/use-auth";
import { SubRowContent } from "./components/sub-row-content";

export default function EquipmentPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allHistory, setAllHistory] = useState<EquipmentHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    Equipment | undefined
  >(undefined);
  const [selectedEquipmentHistory, setSelectedEquipmentHistory] = useState<
    EquipmentHistory[]
  >([]);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const refreshEquipmentAndHistory = useCallback(async () => {
    setLoading(true);
    const equipments = await getEquipments();
    const historyPromises = equipments.map((eq) =>
      getHistoryForEquipment(eq.id)
    );
    const historyResults = await Promise.all(historyPromises);
    setEquipmentList(equipments);
    setAllHistory(historyResults.flat());
    setLoading(false);
  }, []);

  const refreshUsers = useCallback(async () => {
    const userList = await getUsers();
    setUsers(userList);
  }, []);

  useEffect(() => {
    refreshEquipmentAndHistory();
    refreshUsers();
  }, [refreshEquipmentAndHistory, refreshUsers]);

  const handleAdd = () => {
    setSelectedEquipment(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleSave = async (data: Omit<Equipment, "id">) => {
    if (!user) return;
    if (selectedEquipment && selectedEquipment.id) {
      const equipmentData: Equipment = { ...selectedEquipment, ...data };
      await updateEquipment(equipmentData, user.name);
      toast({
        variant: "success",
        title: t("equipment_page.toast.update_title"),
        description: t("equipment_page.toast.update_description", {
          name: equipmentData.instrument,
        }),
      });
    } else {
      await addEquipment(data as any, user.name);
      toast({
        variant: "success",
        title: t("equipment_page.toast.add_title"),
        description: t("equipment_page.toast.add_description", {
          name: data.instrument,
        }),
      });
    }
    await refreshEquipmentAndHistory();
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteEquipmentService(id);
    await refreshEquipmentAndHistory();
  };

  const handleViewHistory = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    const history = await getHistoryForEquipment(equipment.id);
    setSelectedEquipmentHistory(history);
    setIsHistoryOpen(true);
  };

  const handleScheduleMaintenance = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsMaintenanceOpen(true);
  };

  const handleGenerateQr = async (equipment: Equipment) => {
    if (!user) return;
    const updatedEquipment = await updateEquipment(equipment, user.name);
    setSelectedEquipment(updatedEquipment || equipment);
    setIsQrDialogOpen(true);
  };

  const handleImportData = async (data: any[]) => {
    if (!user) return;

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of data) {
      if (!item.internalCode) continue;

      const existingEquipment = await getEquipmentByInternalCode(
        item.internalCode
      );

      if (existingEquipment) {
        const hasChanged = Object.keys(item).some(
          (key) =>
            item[key as keyof any] !== undefined &&
            String(existingEquipment[key as keyof Equipment]) !==
              String(item[key as keyof any])
        );

        if (hasChanged) {
          await updateEquipment({ ...existingEquipment, ...item }, user.name);
          updatedCount++;
        }
      } else {
        await addEquipment(item, user.name);
        createdCount++;
      }
    }

    toast({
      variant: "success",
      title: t("import_page.toast.success_title"),
      description: t("import_page.toast.success_desc", {
        created: createdCount,
        updated: updatedCount,
      }),
    });
    await refreshEquipmentAndHistory();
  };

  const columns = useColumns({
    onEdit: handleEdit,
    onScheduleMaintenance: handleScheduleMaintenance,
    onViewHistory: handleViewHistory,
    onGenerateQr: handleGenerateQr,
  });

  const filteredEquipment = useMemo(() => {
    if (historyStatusFilter.size === 0) {
      return equipmentList;
    }
    const equipmentIdsWithFilteredHistory = new Set(
      allHistory
        .filter((h) => historyStatusFilter.has(h.status))
        .map((h) => h.equipmentId)
    );
    return equipmentList.filter((eq) =>
      equipmentIdsWithFilteredHistory.has(eq.id)
    );
  }, [equipmentList, historyStatusFilter, allHistory]);

  const table = useReactTable({
    data: filteredEquipment,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
  });

  const renderSubComponent = useCallback(({ row }: { row: Row<Equipment> }) => {
    return <SubRowContent row={row} />;
  }, []);

  return (
    <>
      <PageHeader
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              onClick={() => setIsExportOpen(true)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {t("equipment_page.export_button")}
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => setIsImportOpen(true)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t("equipment_page.import_button")}
            </Button>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("equipment_page.add_button")}
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="p-4">
              <DataTableToolbar
                table={table}
                historyStatusFilter={historyStatusFilter}
                onHistoryStatusChange={setHistoryStatusFilter}
              />
            </div>
            <div className="border-y">
              <Table>
                <TableHeader className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {row.getIsExpanded() && (
                          <TableRow>
                            <TableCell colSpan={columns.length}>
                              {renderSubComponent({ row })}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {loading
                          ? "Loading..."
                          : t("equipment_page.no_results")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <DataTablePagination table={table} />
          </CardContent>
        </Card>
      </div>

      {isFormOpen && (
        <EquipmentForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSave={handleSave}
          equipment={selectedEquipment}
        />
      )}

      <ImportExcelDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        equipmentList={equipmentList}
      />

      {isExportOpen && (
        <ExportExcelDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          exportType="equipment"
          equipmentData={equipmentList}
        />
      )}

      {selectedEquipment && user && (
        <>
          {isHistoryOpen && (
            <ViewHistoryDialog
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              equipment={selectedEquipment}
              history={selectedEquipmentHistory}
            />
          )}
          {isMaintenanceOpen && (
            <ScheduleMaintenanceDialog
              isOpen={isMaintenanceOpen}
              onClose={() => setIsMaintenanceOpen(false)}
              equipment={selectedEquipment}
              onMaintenanceAdded={refreshEquipmentAndHistory}
              currentUser={user}
              users={users}
            />
          )}
          {isQrDialogOpen && (
            <GenerateQrDialog
              isOpen={isQrDialogOpen}
              onClose={() => setIsQrDialogOpen(false)}
              equipment={selectedEquipment}
            />
          )}
        </>
      )}
    </>
  );
}
