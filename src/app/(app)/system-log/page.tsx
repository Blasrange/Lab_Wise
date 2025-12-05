// src/app/(app)/history/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { ActivityLog } from "@/lib/types";
import { getActivityLogs } from "@/services/activityLogService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ActivityCard } from "./components/activity-card";
import { History } from "lucide-react";

export default function SystemLogPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const fetchedLogs = await getActivityLogs();
    setLogs(fetchedLogs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <>
      <PageHeader title="" description="" />
      <Card>
        <ScrollArea className="h-[75vh] w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <History className="h-20 w-20 text-muted-foreground/20 animate-pulse" />
              <p className="mt-4 text-lg font-semibold text-primary">
                {t("loading.text")}...
              </p>
            </div>
          ) : logs.length > 0 ? (
            <div className="p-4 sm:p-6 space-y-4">
              {logs.map((log) => (
                <ActivityCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <History className="h-20 w-20 text-muted-foreground/20" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
                {t("system_log_page.no_activity_title")}
              </h3>
              <p className="text-sm text-muted-foreground/80">
                {t("system_log_page.no_activity_desc")}
              </p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </>
  );
}
