"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SmartAlertTool } from "./smart-alert-tool";
import type { Equipment } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { BrainCircuit } from "lucide-react";

interface AiToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
}

export function AiToolsModal({
  isOpen,
  onClose,
  equipmentList,
}: AiToolsModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle>{t("dashboard.ai_tools.title")}</DialogTitle>
              <DialogDescription>
                {t("dashboard.ai_tools.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="pt-4">
          <SmartAlertTool equipmentList={equipmentList} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
