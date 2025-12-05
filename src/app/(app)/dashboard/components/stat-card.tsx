import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "destructive" | "info" | "success";
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const variantClasses = {
    default: "text-muted-foreground",
    warning: "text-orange-500",
    destructive: "text-red-600",
    info: "text-blue-500",
    success: "text-green-600",
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className={cn("flex items-center gap-2", variantClasses[variant])}>
          {icon}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantClasses[variant])}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
