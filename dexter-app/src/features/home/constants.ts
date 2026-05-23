import { tabThemeConfig } from "@/lib/constants";
import type { CaptureFailurePayload, CaptureResult } from "@/lib/types";

export const HOME_THEME = tabThemeConfig.home;
export const CAPTURE_TRIGGER_BUTTON_CLASS =
  "capture-trigger";
export const CAPTURE_TRIGGER_INNER_CLASS = "capture-trigger__inner";
export const PRIMARY_ACTION_BUTTON_CLASS = "solid-action";
export const SECONDARY_ACTION_BUTTON_CLASS = "ghost-action";
export const STAGE_WIDTH_CLASS = "mx-auto w-full";
export const ACTION_AREA_CLASS =
  "mx-auto mt-auto flex min-h-30 w-full max-w-sm items-end justify-center pb-2";
export const SCANNING_PHRASES = ["Identifying..."];
export const COMMON_INVALID_CAPTURE_MESSAGE =
  "We couldn't spot a clear plant or animal in that frame. Move closer, keep one living subject centered, and try again.";

export function isFailureResult(
  value: CaptureResult | null,
): value is CaptureFailurePayload {
  return (
    value?.kind === "low_confidence" ||
    value?.kind === "invalid" ||
    value?.kind === "error"
  );
}
