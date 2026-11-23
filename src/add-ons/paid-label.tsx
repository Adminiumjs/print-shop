/**
 * The paid-label question (plan 79, S39), from the carrier add-on's own bundle.
 *
 * Adminium refuses to move an order back or cancel it while it holds a live
 * paid label. The add-on holds the dialog and this app's client for the
 * shipping routes, so the app only routes its order move through it. An older
 * add-on has no such export, and the refusal then stays a plain refusal.
 */
import { Component, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';

export const PAID_LABEL_HEADER = 'x-adminium-paid-label';

type Attempt<T> = (keep: readonly string[]) => Promise<T>;

interface PaidLabelKit {
  withPaidLabel: <T>(source: { table: string; id: string }, attempt: Attempt<T>) => Promise<T>;
  PaidLabelHost: ComponentType;
  clearPaidLabel?: (source: { table: string; id: string }, attempt: Attempt<unknown>) => Promise<{ keep: readonly string[]; moved: boolean }>;
}

let kit: PaidLabelKit | null = null;
let kitKey: string | null = null;
const listeners = new Set<() => void>();

/** With two carriers attached, the real one's copy answers: DHL's is a demo. */
export function connectPaidLabel(module: unknown, addOnKey: string): void {
  const parts = module as Partial<PaidLabelKit>;
  if (typeof parts.withPaidLabel !== 'function' || typeof parts.PaidLabelHost !== 'function') return;
  if (kitKey === 'shipping-shippo') return;
  kit = parts as PaidLabelKit;
  kitKey = addOnKey;
  for (const listener of listeners) listener();
}

export function movePaidLabel<T>(source: { table: string; id: string }, attempt: Attempt<T>): Promise<T> {
  return kit === null ? attempt([]) : kit.withPaidLabel(source, attempt);
}

/** For a move with other work before it: the question comes first, so that work never happens on an order that stays put. */
export function askPaidLabelFirst(source: { table: string; id: string }, attempt: Attempt<unknown>): Promise<{ keep: readonly string[]; moved: boolean }> {
  if (kit?.clearPaidLabel !== undefined) return kit.clearPaidLabel(source, attempt);
  // No way to ask: the move goes first, so a refusal stops it before any other work is done.
  return attempt([]).then(() => ({ keep: [], moved: true }));
}

/** The person went back from the question: nothing moved, and there is nothing to report. */
export const isPaidLabelStopped = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'PaidLabelStopped';

export const paidLabelHeaders = (keep: readonly string[]): Record<string, string> | undefined =>
  keep.length === 0 ? undefined : { [PAID_LABEL_HEADER]: keep.join(',') };

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A broken add-on loses its dialog, and the move stays refused. It never takes the app down. */
class Contained extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function PaidLabelSlot() {
  const current = useSyncExternalStore(subscribe, () => kit, () => kit);
  if (current === null) return null;
  const Host = current.PaidLabelHost;
  return (
    <Contained>
      {/* Above this app's sheets and below its toasts: the question often opens from a sheet. */}
      <div className='wk-paid-layer'>
        <Host />
      </div>
    </Contained>
  );
}
