"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-provider";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Sun, Moon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useI18n();

  const handleThemeChange = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("settings_page.title")}</DialogTitle>
              <DialogDescription>
                {t("settings_page.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="language-switcher" className="font-semibold">
                {t("settings_page.language.title")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings_page.language.description")}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="theme-switcher" className="font-semibold">
                {t("settings_page.theme.title")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings_page.theme.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              <Switch
                id="theme-switcher"
                onCheckedChange={handleThemeChange}
                defaultChecked={document.documentElement.classList.contains(
                  "dark"
                )}
              />
              <Moon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
