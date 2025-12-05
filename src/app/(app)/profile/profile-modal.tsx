"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { User as UserIcon, Mail, Shield, Briefcase } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const { t } = useI18n();

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl">{user.name}</DialogTitle>
          <DialogDescription>
            {t(`users_page.roles.${user.role.toLowerCase()}`)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">
                {t("users_page.columns.document")}
              </p>
              <p className="text-foreground">
                {user.documentNumber} ({user.documentType})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">
                {t("users_page.columns.status")}
              </p>
              <Badge
                variant={user.status === "Active" ? "default" : "destructive"}
                className={
                  user.status === "Active"
                    ? "bg-green-500/20 text-green-700 border-green-400"
                    : ""
                }
              >
                {t(`users_page.status_options.${user.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
