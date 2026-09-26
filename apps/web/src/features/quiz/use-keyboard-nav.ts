import { useEffect } from "react";

interface KeyboardNavOptions {
  /** Listen only while the quiz run view is on screen. */
  enabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** Arrow keys belong to the control being edited, so leave those targets alone. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}

/**
 * Bind the left/right arrow keys to problem navigation. Plain arrows are skipped while a
 * text field has focus so the answer box keeps its caret movement; Alt+arrows navigate from
 * anywhere, including inside that box.
 */
export function useKeyboardNav({ enabled, onPrevious, onNext }: KeyboardNavOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      // Other modifiers belong to the browser or the focused control.
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!event.altKey && isEditableTarget(event.target)) return;

      event.preventDefault();
      if (event.key === "ArrowLeft") onPrevious();
      else onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onNext, onPrevious]);
}
