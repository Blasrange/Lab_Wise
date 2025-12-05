"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { columns } from "./components/columns";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { DataTableToolbar } from "./components/data-table-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./components/data-table-pagination";
import { useToast } from "@/hooks/use-toast";
import { getUsers, addUser, updateUser } from "@/services/userService";
import { UserForm } from "./components/user-form";
import { useAuth } from "@/hooks/use-auth";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseApp } from "@/firebase/config";

export default function UsersPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [data, setData] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    const users = await getUsers();
    setData(users);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleAdd = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleSave = async (userData: Omit<User, "id" | "avatar">) => {
    if (!currentUser) return;
    try {
      if (selectedUser) {
        await updateUser({ ...selectedUser, ...userData }, currentUser.name);
        toast({
          variant: "success",
          title: t("users_page.toast.update_title"),
          description: t("users_page.toast.update_description", {
            name: userData.name,
          }),
        });
      } else {
        await addUser(userData, currentUser.name);
        toast({
          variant: "success",
          title: t("users_page.toast.add_title"),
          description: t("users_page.toast.add_description", {
            name: userData.name,
          }),
        });
      }
      await refreshUsers();
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Failed to save user:", error);
      if (error.message === "email-in-use") {
        toast({
          variant: "destructive",
          title: "Error de Registro",
          description:
            "El correo electrónico ya está en uso. Por favor, utilice otro.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "No se pudo guardar el usuario. Por favor, inténtelo de nuevo.",
        });
      }
    }
  };

  const handlePasswordReset = async (user: User) => {
    const auth = getAuth(getFirebaseApp());
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        variant: "success",
        title: t("users_page.toast.reset_sent_title"),
        description: t("users_page.toast.reset_sent_description", {
          email: user.email,
        }),
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      let description = t("users_page.toast.reset_failed_description");
      if (error.code === "auth/too-many-requests") {
        description = t("users_page.toast.too_many_requests_description");
      }
      toast({
        variant: "destructive",
        title: t("users_page.toast.reset_failed_title"),
        description: description,
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!currentUser) return;
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    await updateUser({ ...user, status: newStatus }, currentUser.name);
    toast({
      variant: "success",
      title: t("users_page.toast.status_updated_title"),
      description:
        newStatus === "Active"
          ? t("users_page.toast.activated_description", { name: user.name })
          : t("users_page.toast.deactivated_description", { name: user.name }),
    });
    await refreshUsers();
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    meta: {
      handleEdit,
      handlePasswordReset,
      handleToggleStatus,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <PageHeader
        title=""
        actions={
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("users_page.add_button")}
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="p-4">
              <DataTableToolbar table={table} />
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
                      <TableRow
                        key={row.id}
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

      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        user={selectedUser}
        currentUserRole={currentUser?.role}
      />
    </>
  );
}
