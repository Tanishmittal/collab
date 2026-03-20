import type { NavigateFunction } from "react-router-dom";

export const goBackOr = (navigate: NavigateFunction, fallback: string) => {
  const historyIndex =
    typeof window !== "undefined" &&
    typeof window.history.state === "object" &&
    window.history.state !== null &&
    "idx" in window.history.state
      ? Number(window.history.state.idx)
      : 0;

  if (historyIndex > 0) {
    navigate(-1);
    return;
  }

  navigate(fallback);
};
