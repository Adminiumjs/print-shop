/**
 * A modal's frame, shared by the works' overlays: the proof sheet, the
 * spoilage dialog, the delivery quote, the add-ons' dialogs. Escape and the
 * scrim close it; focus starts inside it, stays inside it, and goes back to
 * what opened it.
 */
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import { useWorks } from "../store.ts";

export const close = () => useWorks.setState({ overlay: null });

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ kind = "dialog", labelledBy, describedBy, alert = false, children }: { kind?: "dialog" | "sheet" | "wide"; labelledBy: string; describedBy?: string; alert?: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => before?.focus?.();
  }, []);
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || box.current === null) return;
    const all = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (all.length === 0) return;
    const first = all[0]!;
    const last = all[all.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <div className={`wk-scrim wk-scrim--${kind}`} onClick={close} onKeyDown={onKey}>
      <div
        ref={box}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={labelledBy}
        {...(describedBy === undefined ? {} : { "aria-describedby": describedBy })}
        className={`wk-${kind}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
