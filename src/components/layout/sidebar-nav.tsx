"use client";

import { usePathname } from "next/navigation";
import {
  FlaskConical,
  LayoutDashboard,
  Users,
  Bell,
  SlidersHorizontal,
  History,
  ClipboardCheck,
  Globe,
} from "lucide-react";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { useAuth } from "@/hooks/use-auth";

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user } = useAuth();

  const menuItems = [
    {
      href: "/dashboard",
      label: t("sidebar.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/equipment",
      label: t("sidebar.equipment"),
      icon: SlidersHorizontal,
    },
    { href: "/my-tasks", label: t("sidebar.my_tasks"), icon: ClipboardCheck },
    {
      href: "/map",
      label: t("sidebar.map"),
      icon: Globe,
      roles: ["Admin", "Supervisor"],
    },
    {
      href: "/users",
      label: t("sidebar.users"),
      icon: Users,
      roles: ["Admin", "Supervisor"],
    },
    { href: "/notifications", label: t("sidebar.notifications"), icon: Bell },
    {
      href: "/system-log",
      label: t("sidebar.system_log"),
      icon: History,
      roles: ["Admin"],
    },
  ];

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:transition-all">
            <h2 className="text-lg font-semibold tracking-tighter text-sidebar-foreground">
              LabWise
            </h2>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) {
              return null;
            }
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, side: "right" }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
