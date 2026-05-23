"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { tabThemeConfig, tabs } from "@/lib/constants";
import { getThemeStyle } from "@/lib/theme";
import type { TabSlug } from "@/lib/types";

function pathForTab(slug: TabSlug) {
  return slug === "home" ? "/home" : `/${slug}`;
}

export function BinderShell({
  activeTab,
  title,
  action,
  children,
}: {
  activeTab: TabSlug;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeIndex = tabs.findIndex((tab) => tab.slug === activeTab);
  const activeTheme = tabThemeConfig[activeTab];

  return (
    <div
      className="theme-scope flex h-[100dvh] w-full overflow-hidden bg-background text-foreground"
      style={getThemeStyle(activeTheme)}
    >
      <div className="relative z-20 flex h-full w-12 shrink-0 sm:w-14">
        <div className="absolute inset-y-0 right-0 z-0 w-0.5 bg-border-strong" />

        <nav className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex flex-col">
          {tabs.map((tab, index) => {
            const active = tab.slug === activeTab;
            const tabTheme = tabThemeConfig[tab.slug];

            return (
              <Link
                key={tab.slug}
                href={pathForTab(tab.slug)}
                className="pointer-events-auto relative block focus:outline-none"
                style={{
                  zIndex: active ? 30 : 10,
                  marginTop: index === 0 ? 0 : -2,
                }}
              >
                <div
                  className="binder-rail-tab"
                  data-active={active}
                  style={{
                    backgroundColor: active
                      ? "var(--background)"
                      : tabTheme.accent,
                    height: active ? 160 : 140,
                    boxShadow: active
                      ? "none"
                      : "inset -4px 0 6px -3px rgba(0,0,0,0.1)",
                  }}
                >
                  <span
                    className="select-none transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: active ? tabTheme.accent : "var(--surface)",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: active ? "1rem" : "0.875rem",
                      letterSpacing: "0.08em",
                      textShadow: active
                        ? "none"
                        : "0 1px 2px rgba(0,0,0,0.15)",
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{
              opacity: 0,
              y: activeIndex > tabs.length / 2 ? 30 : -30,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: activeIndex > tabs.length / 2 ? -20 : 20,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="mx-auto flex min-h-full w-full max-w-4xl flex-col"
          >
            <main className="flex-1 px-4 py-8">{children}</main>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
