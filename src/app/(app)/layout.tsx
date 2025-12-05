"use client";
import React, { useEffect, Suspense, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  ChevronsLeft,
  FlaskConical,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { ProfileModal } from "./profile/profile-modal";
import { SettingsModal } from "./settings/settings-modal";
import useIdleTimeout from "@/hooks/use-idle-timeout";

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      className="hidden w-full justify-center group-data-[collapsible=icon]:flex"
      tooltip={{ children: "Expand sidebar", side: "right" }}
    >
      <ChevronsLeft className="size-4 shrink-0 rotate-180" />
      <span className="sr-only">Expand sidebar</span>
    </SidebarMenuButton>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  useIdleTimeout(handleLogout);

  useEffect(() => {
    if (!loading && !user && isClient) {
      router.push("/login");
    }
  }, [user, loading, router, isClient]);

  if (loading || !user || !isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent">
          <FlaskConical className="h-20 w-20 animate-pulse text-primary" />
          <p className="mt-4 text-lg font-semibold text-primary">
            {t("loading.text")}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarNav />
        <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarToggle />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.avatar || "/avatars/01.png"}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("layout.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsSettingsModalOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("layout.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("layout.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="relative flex-1 space-y-6 p-4 pt-6 md:p-8">
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent">
                  <FlaskConical className="h-20 w-20 animate-pulse text-primary" />
                  <p className="mt-4 text-lg font-semibold text-primary">
                    {t("loading.text")}...
                  </p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </SidebarInset>

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
        />
      )}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </SidebarProvider>
  );
}
