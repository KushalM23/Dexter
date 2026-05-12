"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const activeIndex = tabs.findIndex((t) => t.slug === activeTab);

  return (
    <div className="flex min-h-screen w-full bg-[#FAFAFF] text-[#1A1A1A]">

      {/* Binder Tab Rail */}
      <div className="relative z-20 flex min-h-screen w-[48px] flex-shrink-0 sm:w-[56px]">
        {/* Spine — full-height vertical line at the right edge of the rail */}
        <div className="absolute bottom-0 right-0 top-0 z-0 w-[2px] bg-[#1A1A1A]" />

        {/* Tab stack */}
        <nav className="absolute left-0 right-0 top-[12%] z-10 flex flex-col">
          {tabs.map((tab, index) => {
            const active = tab.slug === activeTab;
            const tabColor = tabTheme[tab.slug];

            return (
              <Link
                key={tab.slug}
                href={pathForTab(tab.slug)}
                className="pointer-events-auto relative block focus:outline-none"
                style={{
                  zIndex: active ? 30 : 10,
                  marginTop: index !== 0 ? -2 : 0,
                }}
              >
                <div
                  className="flex items-center justify-center transition-all duration-200 ease-out"
                  style={{
                    backgroundColor: active ? "#FAFAFF" : tabColor,
                    height: active ? 120 : 100,
                    border: "2px solid #1A1A1A",
                    borderRight: active ? "none" : "2px solid #1A1A1A",
                    boxShadow: active
                      ? "none"
                      : "inset -4px 0 6px -3px rgba(0,0,0,0.1)",
                  }}
                >
                  <span
                    className="select-none transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: active ? tabColor : "#FFFFFF",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: active ? "0.75rem" : "0.65rem",
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

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto bg-[#FAFAFF]">
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
            className="mx-auto flex min-h-screen w-full max-w-4xl flex-col"
          >
            <header className="border-b-[2px] border-black/10 px-6 pb-5 pt-12 sm:px-12 sm:pt-16">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="mb-3 h-[6px] w-12 rounded-full"
                    style={{ backgroundColor: tabTheme[activeTab] }}
                  />
                  <h1
                    className="text-[2.5rem] leading-[0.9] tracking-[-0.04em]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {title}
                  </h1>
                </div>
                {action}
              </div>
            </header>
            <main className="flex-1 px-6 pb-20 pt-8 sm:px-12">
              {children}
            </main>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
