import { config } from "dotenv";
config();

import "@/ai/flows/smart-alerting.ts";
import "@/ai/flows/send-email.ts";
import "@/ai/flows/overdue-maintenance-flow.ts";
import "@/ai/flows/calibration-due-flow.ts";
import "@/ai/flows/maintenance-reminder-flow.ts";
import "@/ai/flows/maintenance-completed-flow.ts";
import "@/ai/flows/translate-text-flow.ts";
