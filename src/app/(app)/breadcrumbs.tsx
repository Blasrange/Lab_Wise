"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";

const Breadcrumbs = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    // Translate segment, fallback to capitalized segment
    const label =
      t(`breadcrumbs.${segment}`) ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-sm md:text-lg text-muted-foreground"
    >
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRight className="h-4 w-4" />
            <Link
              href={breadcrumb.href}
              className={`ml-1 ${
                breadcrumb.isLast
                  ? "font-semibold text-foreground"
                  : "hover:text-foreground transition-colors"
              }`}
              aria-current={breadcrumb.isLast ? "page" : undefined}
            >
              {breadcrumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
