"use client";

import { RouteErrorState } from "@/components/ui/screen-primitives";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      title="Page went off trail"
      message="We hit a snag while opening this binder page. Give it another shot."
      accent="#FE5F55"
      soft="#FFD7D3"
      onRetry={reset}
    />
  );
}
