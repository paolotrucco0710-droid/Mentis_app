"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/ui";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
      aria-label="Navigazione principale"
    >
      <div className="mx-auto grid h-[var(--nav-height)] max-w-5xl grid-cols-5 px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              )}
            >
              <NavIcon
                name={item.icon}
                className={cn(active && "scale-105")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
