// src/components/layout/language-switcher.tsx
"use client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const USFlagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 3 2"
  >
    <path fill="#B22234" d="M0 0h3v2H0z" />
    <path
      fill="#fff"
      d="M0 .2h3v.2H0zm0 .4h3v.2H0zm0 .4h3v.2H0zm0 .4h3v.2H0zm0 .4h3v.2H0z"
    />
    <path fill="#3C3B6E" d="M0 0h1.2v1H0z" />
    <path
      fill="#fff"
      d="m.1.1 1 .65M.1.75l1-.65m-.55.65.1-1m-.1 1 .3-.85-.5.2Zm.4-1 .3.85-.5-.2z"
    />
  </svg>
);

const COFlagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 3 2"
  >
    <path fill="#FFCD00" d="M0 0h3v2H0z" />
    <path fill="#003087" d="M0 1h3v1H0z" />
    <path fill="#C8102E" d="M0 1.5h3v.5H0z" />
  </svg>
);

export default function LanguageSwitcher() {
  const { setLocale, locale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          disabled={locale === "en"}
          className="flex items-center gap-2"
        >
          <USFlagIcon />
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("es")}
          disabled={locale === "es"}
          className="flex items-center gap-2"
        >
          <COFlagIcon />
          <span>Español</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
