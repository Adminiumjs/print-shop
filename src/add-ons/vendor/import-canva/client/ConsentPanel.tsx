/*
 * VENDORED from add-on-import-canva/src/client/ConsentPanel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * The consent panel: what the customer is agreeing to, in words, BEFORE they
 * agree to it.
 *
 * It exists because a scope string is not consent. `design:meta:read` tells a
 * customer nothing; "read the list of your designs" tells them exactly what
 * happens, and the third row — that nothing else happens — is the one most
 * consent screens leave out. The rows are message keys so all eight locales get
 * the same promise rather than seven of them getting an English one.
 *
 * The panel is real, and in the demo it authorizes against a fixture: no
 * redirect, no token, no account contacted (24 D11). The host runs the actual
 * authorization-code flow in a connected build; this add-on never sees a
 * secret either way (§5.6).
 */

import { Check } from "lucide-react";

import type { MessageKey } from "../i18n/t.ts";
import { useAddOnT } from "../i18n/useT.ts";
import { CONSENT_PERMISSIONS } from "../oauth.ts";
import { DemoNote, Monogram } from "./bits.tsx";

export function ConsentPanel({
  simulated,
  onAuthorize,
  onCancel,
}: {
  /** True when the transport behind the flow answers from a fixture (D11). */
  simulated: boolean;
  onAuthorize: () => void;
  onCancel: () => void;
}) {
  const t = useAddOnT();

  return (
    <div
      className="cvi-scrim cvi-scrim--nested"
      // The flow's own scrim is this element's parent and closes the whole
      // import when clicked. Cancelling consent must not do that: the customer
      // said no to authorizing, not to importing.
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="cvi-consent"
        role="dialog"
        aria-modal="true"
        aria-label={t("consent.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <Monogram />
        <div className="cvi-card-title" style={{ marginBlock: "13px 6px" }}>
          {t("consent.title")}
        </div>
        <p className="cvi-p" style={{ fontSize: 13 }}>
          {t("consent.body")}
        </p>

        <div className="cvi-perms">
          {CONSENT_PERMISSIONS.map((key) => (
            <div className="cvi-perm" key={key}>
              <Check size={15} aria-hidden="true" />
              <span>{t(key as MessageKey)}</span>
            </div>
          ))}
        </div>

        {/* AC7 — ABOVE the button, not below it. This is the screen where a
            customer decides to hand over access, so if the authorization is
            simulated they have to be told before they press, not after. */}
        {simulated && (
          <div style={{ marginBlockEnd: 12 }}>
            <DemoNote messageKey="demo.consent" />
          </div>
        )}

        {/* 24 D12 — on the surface where the customer decides, not in a footer. */}
        <p className="cvi-fine" style={{ marginBlockEnd: 16 }}>
          {t("notAffiliated")}
        </p>

        <div className="cvi-actions">
          <button type="button" className="cvi-button cvi-button--block" onClick={onAuthorize}>
            {t("connect.authorize")}
          </button>
          <button type="button" className="cvi-button cvi-button--ghost" onClick={onCancel}>
            {t("consent.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
