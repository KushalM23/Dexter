"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { tabs, tabTheme } from "@/lib/constants";
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
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7bf,_transparent_35%),linear-gradient(180deg,#f5f7ff_0%,#f8f4ff_45%,#fff8e8_100%)] px-4 py-4 text-[#1A1A1A] sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <div className="relative flex w-full max-w-[440px] overflow-visible rounded-[42px] border-[5px] border-[#1A1A1A] bg-[#FAFAFF] shadow-[0_28px_70px_rgba(34,34,34,0.18)]">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="flex min-h-[860px] flex-1 flex-col overflow-hidden rounded-[36px]"
          >
            <header className="border-b-[3px] border-black/8 px-6 pt-8 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="mb-2 h-2 w-16 rounded-full"
                    style={{ backgroundColor: tabTheme[activeTab] }}
                  />
                  <h1 className="font-[family:var(--font-display)] text-[2.15rem] leading-[0.94] tracking-[-0.04em]">
                    {title}
                  </h1>
                </div>
                {action}
              </div>
            </header>
            <main className="relative flex-1 overflow-y-auto px-6 pb-8 pt-5">
              {children}
            </main>
          </motion.div>

          <nav className="pointer-events-none absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-end gap-2">
            {tabs.map((tab) => {
              const active = tab.slug === activeTab;
              const tabColor = tabTheme[tab.slug];

              return (
                <Link
                  key={tab.slug}
                  href={pathForTab(tab.slug)}
                  className="pointer-events-auto group block focus:outline-none"
                >
                  <motion.div
                    whileHover={{ x: -4 }}
                    className="flex h-[84px] w-[44px] items-center justify-center rounded-r-[18px] rounded-l-[14px] border-[3px] border-[#1A1A1A] shadow-[0_10px_22px_rgba(34,34,34,0.13)]"
                    style={{
                      backgroundColor: active ? tabColor : `${tabColor}4D`,
                      width: active ? 50 : 42,
                    }}
                  >
                    <span
                      className="font-[family:var(--font-display)] text-[0.72rem] tracking-[0.2em]"
                      style={{
                        color: active ? "#FAFAFF" : "#1A1A1A",
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {tab.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
