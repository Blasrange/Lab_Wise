"use client";

import { FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";

export default function Loading() {
  const { t } = useI18n();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent">
      <FlaskConical className="h-20 w-20 animate-pulse text-primary" />
      <p className="mt-4 text-lg font-semibold text-primary">
        {t("loading.text")}...
      </p>
    </div>
  );
}
