"use server";
/**
 * @fileOverview A Genkit flow for translating text into a specified language.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const TranslateTextInputSchema = z.object({
  text: z.string().describe("The text to be translated."),
  targetLanguage: z
    .string()
    .describe(
      'The target language code (e.g., "en" for English, "es" for Spanish).'
    ),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe("The translated text."),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: "translateTextPrompt",
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Translate the following text into the language with the code "{{targetLanguage}}".
  
  Text to translate: "{{text}}"
  
  Only return the translated text itself, without any additional explanations or context.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: "translateTextFlow",
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // For very short texts, sometimes the model can be inconsistent.
    // We'll add a check to avoid unnecessary API calls for simple keys.
    if (input.text.includes(".") && input.text.length < 50) {
      return { translatedText: input.text };
    }

    const { output } = await prompt(input);
    return output!;
  }
);
