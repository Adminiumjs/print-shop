/*
 * VENDORED from add-ons/packages/design-studio/src/ui/useViewport.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
import { useEffect, useState } from "react";

/** Below this the editor goes canvas-first (prompt J, screen 5). */
export const NARROW_PX = 900;

export interface Viewport {
  width: number;
  height: number;
  narrow: boolean;
}

function read(): Viewport {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const height = typeof window === "undefined" ? 800 : window.innerHeight;
  return { width, height, narrow: width < NARROW_PX };
}

/**
 * The viewport, for the one thing that genuinely needs it: fitting a document
 * measured in millimetres onto a screen measured in pixels.
 *
 * A media query cannot do this job — the switch below 900px is STRUCTURAL (the
 * tool rail becomes a bottom bar and the inspector becomes a sheet), and the
 * canvas scale is arithmetic over the viewport rather than a breakpoint. The
 * state only changes when `narrow` flips or the numbers actually move, so a
 * drag across a resize does not re-render on every pixel.
 */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(read);

  useEffect(() => {
    const onResize = () => {
      setViewport((prev) => {
        const next = read();
        return prev.width === next.width && prev.height === next.height ? prev : next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}
