/*
 * VENDORED from add-on-import-canva/src/client/SettingsPanel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * This add-on's settings panel — which is a panel about not having any.
 *
 * It fills `settings.add-on.panel` like the other two, and that is the point:
 * the manage drawer used to carry `addOn.key === "import-canva"` with this
 * block written inline, so the host knew that one particular add-on's whole
 * configuration is its account. It does not know that now. The slot is
 * rendered, this fills it, and an add-on with nothing to set still gets to say
 * so in its own words rather than being described by a host that guessed.
 *
 * A heading over an empty form would be worse than either.
 */

import { UserCheck } from "lucide-react";

import { DEMO_ACCOUNT, DEMO_AUTHORIZED_ON, type CanvaTransport } from "../demo/transport.ts";
import { useAddOnT } from "../i18n/useT.ts";
import { DemoNote, Mono, useDateFormat } from "./bits.tsx";

/**
 * AC7 APPLIES HERE TOO, and this panel is where it was first missed.
 *
 * The account row prints `DEMO_ACCOUNT` and `DEMO_AUTHORIZED_ON` — a name and a
 * date only a real OAuth connection could hand back, and in the demo a fixture.
 * A shop owner opening the manage drawer would read "studio@marlowpress.test ·
 * authorized 1 Aug" as a connection that exists. So the panel carries the same
 * label the four flow steps carry, driven by the same `transport.simulated`
 * flag: a self-host build that swaps in the host's authorized client removes
 * the label by doing so, and leaves no copy behind claiming a demo.
 *
 * The transport is a PROP rather than a module-level constant for exactly that
 * reason — a panel that decided "simulated" for itself could not stop being
 * simulated.
 */
export function SettingsPanel({ transport }: { transport: CanvaTransport }) {
  const t = useAddOnT();
  const day = useDateFormat();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 11,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          borderRadius: 12,
          padding: "13px 14px",
        }}
      >
        <UserCheck size={17} aria-hidden="true" style={{ flex: "0 0 auto", marginBlockStart: 1 }} />
        <span style={{ minInlineSize: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>
            {t("set.account")}
          </span>
          <Mono>
            <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
              {t("set.accountWhen", {
                account: DEMO_ACCOUNT,
                when: day(DEMO_AUTHORIZED_ON),
              })}
            </span>
          </Mono>
        </span>
      </div>
      {transport.simulated && <DemoNote messageKey="demo.account" />}
      <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{t("set.nothingElse")}</div>
    </div>
  );
}
