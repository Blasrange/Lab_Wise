"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";

interface TranslatedTextProps {
  text: string;
}

export function TranslatedText({ text }: TranslatedTextProps) {
  const { t } = useI18n();

  // The component now directly uses the 't' function.
  // The 't' function itself handles falling back to the key if a translation is not found.
  const translatedContent = t(text);

  return <>{translatedContent}</>;
}
