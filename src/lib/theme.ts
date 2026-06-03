import type { CSSProperties } from "react";

import { tabThemeConfig } from "@/lib/constants";
import type { TabSlug } from "@/lib/types";

type ThemeConfig = (typeof tabThemeConfig)[TabSlug];

type ThemeStyle = CSSProperties & {
  "--theme-accent": string;
  "--theme-soft": string;
  "--theme-wash": string;
  "--theme-ink": string;
  "--theme-contrast": string;
  "--theme-chrome": string;
  "--theme-shadow": string;
};

export function getThemeStyle(theme: ThemeConfig): ThemeStyle {
  return {
    "--theme-accent": theme.accent,
    "--theme-soft": theme.soft,
    "--theme-wash": theme.wash,
    "--theme-ink": theme.ink,
    "--theme-contrast": theme.contrast,
    "--theme-chrome": theme.chrome,
    "--theme-shadow": theme.shadow,
  };
}
