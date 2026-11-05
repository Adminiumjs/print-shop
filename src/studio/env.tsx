/**
 * What every works screen reaches through React: the door into Adminium,
 * where the dashboard's pages are, and the hooks that read the
 * rows and run a write.
 *
 * A write is run the same way everywhere: while it is on, the screen says
 * so; when it is done, the rows are read again (Adminium's figures, never the
 * screen's guess); when it is refused, the refusal is said in a toast in the
 * reader's words, and the rows are read again too, so the screen shows what
 * is true now.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import type { WorksData, WorksDoor } from "./door.ts";
import { toast, useWorks } from "./store.ts";
import { isApiError } from "./wire.ts";
import { useT } from "../i18n/index.tsx";

export interface WorksEnv {
  door: WorksDoor;
  /** An add-on's own page in the dashboard (the Customiser's designs, Inventory's receiving). */
  addOnPageHref: (key: string, ref: string) => string;
  /** Adminium's own add-ons page, where an add-on is installed and its keys are kept. */
  addOnsHref: string;
  /** Adminium's sign-in, where a sign-out lands. */
  signInHref: string;
  /** An add-on's own settings in the dashboard (Holiday calendars' closed days), for a role that keeps them. */
  addOnSettingsHref: (key: string) => string;
  /** The dashboard's privacy page, on a person's data: where the owner finds and erases a customer's. */
  privacyHref: string;
}

/** A job held in prepress by its proof, said before Adminium is asked. */
export class HeldByProof extends Error {
  readonly lock: "waiting" | "unapproved";
  readonly ref: string;
  constructor(lock: "waiting" | "unapproved", ref: string) {
    super(lock);
    this.name = "HeldByProof";
    this.lock = lock;
    this.ref = ref;
  }
}

const Ctx = createContext<WorksEnv | null>(null);

export function WorksProvider({ env, children }: { env: WorksEnv; children: ReactNode }) {
  return <Ctx.Provider value={env}>{children}</Ctx.Provider>;
}

export function useEnv(): WorksEnv {
  const env = useContext(Ctx);
  if (env === null) throw new Error("useEnv() outside <WorksProvider>");
  return env;
}

/** The rows last read. The shell renders the screens only once there are some. */
export function useData(): WorksData {
  const data = useWorks((s) => s.data);
  if (data === null) throw new Error("useData() before the first read");
  return data;
}

/** Read every row again, and keep them. */
export async function reload(door: WorksDoor): Promise<void> {
  try {
    const data = await door.load();
    useWorks.setState({ data, failure: null });
  } catch (error) {
    useWorks.setState({ failure: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * A write as a screen runs it: `busy` while it is on, the rows read again
 * after, a refusal said in a toast. The work returns the toast to say when it
 * went (or nothing).
 */
export function useRun(): { busy: boolean; run: (work: (door: WorksDoor, data: WorksData) => Promise<string | null | undefined | void>) => Promise<boolean> } {
  const { door } = useEnv();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (work: (door: WorksDoor, data: WorksData) => Promise<string | null | undefined | void>) => {
      const data = useWorks.getState().data;
      if (data === null) return false;
      setBusy(true);
      try {
        const said = await work(door, data);
        if (typeof said === "string") toast(said, "pos");
        return true;
      } catch (error) {
        if (error instanceof HeldByProof) toast(t(error.lock === "waiting" ? "works.lock.waiting" : "works.lock.unapproved", { ref: error.ref }), "warn");
        // Adminium held the job in prepress: its proof is not approved (the move's `requires`).
        else if (isApiError(error) && error.code === "STATE_MOVE_REFUSED" && error.params["from"] === "prepress" && error.params["to"] === "printing" && error.params["named"] === undefined) toast(t("works.lock.held"), "warn");
        // The row moved on since the screen read it.
        else if (isApiError(error) && (error.code === "ROW_CHANGED" || error.code === "WRITE_CONFLICT" || (error.code === "STATE_MOVE_REFUSED" && error.params["named"] !== undefined))) toast(t("works.moved"), "warn");
        else if (isApiError(error) && error.status === 403) toast(t("works.notAllowed"), "danger");
        else toast(t("works.refused", { why: error instanceof Error ? error.message : String(error) }), "danger");
        return false;
      } finally {
        await reload(door);
        setBusy(false);
      }
    },
    [door, t],
  );
  return { busy, run };
}
