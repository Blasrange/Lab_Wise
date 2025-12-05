// src/ai/flows/smart-alerting.ts
"use server";
/**
 * @fileOverview AI-powered tool that analyzes equipment data and proactively recommends maintenance or calibration.
 *
 * - smartAlert - A function that handles the smart alerting process.
 * - SmartAlertInput - The input type for the smartAlert function.
 * - SmartAlertOutput - The return type for the smartAlert function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SmartAlertInputSchema = z.object({
  equipmentData: z
    .string()
    .describe(
      "Data about the equipment, including usage patterns, maintenance history (with counts for preventive, corrective, and predictive maintenance), and calibration records."
    ),
  language: z
    .string()
    .describe(
      'The language for the AI to respond in (e.g., "en" for English, "es" for Spanish).'
    ),
});
export type SmartAlertInput = z.infer<typeof SmartAlertInputSchema>;

const SmartAlertOutputSchema = z.object({
  recommendation: z
    .string()
    .describe(
      "Recommendation for maintenance or calibration based on the equipment data."
    ),
  urgency: z
    .enum(["high", "medium", "low"])
    .describe("Urgency of the recommendation."),
  explanation: z
    .string()
    .describe(
      "Explanation of why the recommendation is being made, considering the maintenance history provided."
    ),
});
export type SmartAlertOutput = z.infer<typeof SmartAlertOutputSchema>;

export async function smartAlert(
  input: SmartAlertInput
): Promise<SmartAlertOutput> {
  return smartAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: "smartAlertPrompt",
  input: { schema: SmartAlertInputSchema },
  output: { schema: SmartAlertOutputSchema },
  prompt: `You are an AI assistant that analyzes equipment data and recommends maintenance or calibration.

  Analyze the following equipment data, paying close attention to the maintenance history counts (preventive, corrective, predictive). A high number of corrective maintenances might indicate a recurring problem.

  Provide a recommendation for maintenance or calibration. Include the urgency of the recommendation, and an explanation of why the recommendation is being made.

  The response MUST be in the language with the code: {{{language}}}.

  Equipment Data: {{{equipmentData}}}
  Output the recommendation, urgency, and explanation in JSON format. The urgency should be one of: high, medium, low.
  `,
});

const smartAlertFlow = ai.defineFlow(
  {
    name: "smartAlertFlow",
    inputSchema: SmartAlertInputSchema,
    outputSchema: SmartAlertOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
