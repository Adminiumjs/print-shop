// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Preloaded into the contract's Adminium (`node --import`): the server's clock
 * starts at `CONTRACT_NOW` (epoch ms) and runs on from there.
 *
 * The contract adds the sample at the moment the comps pin the works to —
 * 10:20 on Wednesday 5 August 2026 in Marlow — so every date it asserts (a
 * ready-by) is the literal one, on every engine. Only JavaScript's clock
 * moves; the server reads its "now" from it. The contract may set it again
 * while the server runs (`Server.setClock`).
 */
import { readFileSync } from "node:fs";

const target = Number(process.env.CONTRACT_NOW);
if (Number.isFinite(target)) {
  const RealDate = Date;
  let offset = target - RealDate.now();
  /** A moment the clock stands still at, while the sample goes in; null while it runs. */
  let still = null;
  const now = () => still ?? RealDate.now() + offset;
  // The contract sets the clock again (a SIGUSR2, the new "now" in CONTRACT_CLOCK_FILE, "<ms>" or
  // "<ms> still"): to 10:20 on the dot while the sample goes in, and running on from there after.
  const file = process.env.CONTRACT_CLOCK_FILE;
  if (file) {
    process.on("SIGUSR2", () => {
      const [at, mode] = readFileSync(file, "utf8").trim().split(/\s+/);
      const next = Number(at);
      if (!Number.isFinite(next)) return;
      offset = next - RealDate.now();
      still = mode === "still" ? next : null;
    });
  }
  class ContractDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(now());
      else super(...args);
    }
    static now() {
      return now();
    }
  }
  globalThis.Date = ContractDate;
}
