"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center">
        <FlaskConical className="h-20 w-20 animate-pulse text-primary" />
        <p className="mt-4 text-lg font-semibold text-primary">
          {t("loading.text")}...
        </p>
      </div>
    </div>
  );
}
