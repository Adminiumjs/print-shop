/**
 * ONE OF ADMINIUM'S OWN PARTS on a works screen: the refund of an online
 * payment, drawn by Adminium's own React with the dashboard's two steps,
 * words and toast, never a copy of them here.
 *
 * The staff config says where the kit is (`kit.entry`, a file whose name
 * changes with every version of Adminium, so it is read each time the page
 * loads and never kept). The kit is loaded once per page; the part is
 * mounted once and then only told what changed. When it cannot be drawn
 * here (no kit in this Adminium, another contract, the file did not load),
 * `fallback` is shown in its place and the screen stays usable around it.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { KitAccess } from "./door.ts";

/** The contract of the kit's mount call this file was written for. */
export const KIT_CONTRACT = 1;

export interface KitMounted<Props> {
  update(props: Partial<Props>): void;
  unmount(): void;
}

interface Kit {
  mount<Props>(part: string, element: Element, props: Props): Promise<KitMounted<Props>>;
}

type Importer = (address: string) => Promise<unknown>;
const byAddress: Importer = (address) => import(/* @vite-ignore */ address);

const loaded = new Map<string, Promise<Kit>>();

/** The kit this Adminium serves, loaded once per page; a load that failed is tried again the next time. */
export function loadKit(kit: Pick<KitAccess, "contract" | "entry">, importer: Importer = byAddress): Promise<Kit> {
  if (kit.contract !== KIT_CONTRACT) return Promise.reject(new Error("contract"));
  const kept = loaded.get(kit.entry);
  if (kept !== undefined) return kept;
  const asked = importer(kit.entry).then((module) => {
    if (typeof (module as { mount?: unknown } | null)?.mount !== "function") throw new Error("no mount");
    return module as Kit;
  });
  loaded.set(kit.entry, asked);
  asked.catch(() => loaded.delete(kit.entry));
  return asked;
}

/** Forget what was loaded. For tests. */
export function resetKit(): void {
  loaded.clear();
}

export function KitPart<Props extends object>({ kit, part, props, fallback, importer }: { kit: KitAccess | null; part: string; props: Props; fallback: ReactNode; importer?: Importer }) {
  const host = useRef<HTMLDivElement>(null);
  const mounted = useRef<KitMounted<Props> | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [missing, setMissing] = useState(kit === null);

  useEffect(() => {
    const element = host.current;
    if (element === null || kit === null) return;
    let gone = false;
    setMissing(false);
    loadKit(kit, importer)
      .then((loadedKit) => loadedKit.mount<Props>(part, element, latest.current))
      .then(
        (made) => {
          if (gone) return made.unmount();
          mounted.current = made;
          made.update(latest.current);
        },
        () => {
          if (!gone) setMissing(true);
        },
      );
    return () => {
      gone = true;
      mounted.current?.unmount();
      mounted.current = null;
    };
  }, [kit, part, importer]);

  useEffect(() => {
    mounted.current?.update(props);
  }, [props]);

  return (
    <>
      <div ref={host} hidden={missing} data-kit-part={part} />
      {missing && fallback}
    </>
  );
}
