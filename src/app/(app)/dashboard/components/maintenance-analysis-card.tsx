"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/components/ui/chart";

interface MonthlyData {
  month: string;
  scheduled: number;
  completed: number;
  efficiency: number;
}

interface MaintenanceAnalysisCardProps {
  title: string;
  data: MonthlyData[];
  color: string;
  chartColor: string;
}

const chartConfig = {
  efficiency: {
    label: "Efficiency",
  },
} satisfies ChartConfig;

export function MaintenanceAnalysisCard({
  title,
  data = [],
  color,
  chartColor,
}: MaintenanceAnalysisCardProps) {
  const { t } = useI18n();

  return (
    <Card className="flex flex-col">
      <CardHeader className={cn("p-3 rounded-t-lg text-white", color)}>
        <CardTitle className="text-center text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.analysis_cards.month")}</TableHead>
              <TableHead className="text-center">
                {t("dashboard.analysis_cards.scheduled")}
              </TableHead>
              <TableHead className="text-center">
                {t("dashboard.analysis_cards.completed")}
              </TableHead>
              <TableHead className="text-right">
                {t("dashboard.analysis_cards.efficiency")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.month}>
                <TableCell>{item.month}</TableCell>
                <TableCell className="text-center">{item.scheduled}</TableCell>
                <TableCell className="text-center">{item.completed}</TableCell>
                <TableCell className="text-right font-bold">
                  {item.efficiency}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="h-40 w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 0, right: 10, left: -20, bottom: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                dy={10}
                fontSize={12}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                dx={-5}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{
                  fontWeight: "bold",
                }}
                formatter={(value) => [
                  `${value}%`,
                  t("dashboard.analysis_cards.efficiency"),
                ]}
              />
              <Bar
                dataKey="efficiency"
                fill={chartColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
