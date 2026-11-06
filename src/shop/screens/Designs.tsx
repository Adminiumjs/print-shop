/**
 * Your designs (the Customiser's own screen, in the shop's look): the designs
 * this browser holds a link to, and those of the order the lookup or a link
 * opened, read by their codes. And the page the sign-in link in an e-mail
 * lands on (`/c#<code>`): it greets the person by the first name Adminium
 * gives, and signs them in only when they press Continue.
 */
import { CircleAlert, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { YourDesigns } from "../../../vendor/customiser/index.js";
import { useI18n } from "../../i18n/index.tsx";
import { continueSignIn, openCodes, openDesignLink, peekSignIn, signedIn, useAfter } from "../after.ts";
import { goView, openDesign, useShop } from "../store.ts";

/** The design codes this page may open: the open order's, or every one of the signed-in customer's jobs. */
function codesNow(): string[] {
  const s = useAfter.getState();
  const own = signedIn() && s.mine.rows !== null ? s.mine.rows.jobs.map((j) => j["design_code"]).filter((c): c is string => typeof c === "string" && c !== "") : [];
  return [...new Set([...openCodes(), ...own])];
}

export function DesignsScreen() {
  const { t, locale } = useI18n();
  const port = useShop((s) => s.port);
  const held = useShop((s) => s.held);
  const works = useShop((s) => s.catalogue?.works.name ?? "");
  useAfter((s) => s.opened);
  useAfter((s) => s.mine);
  const state = useDesignLink(port !== null);
  if (port === null) return null;
  return (
    <section className="mp-screen ma-page" aria-label={t("after.designs.label")}>
      {state === "unknown" || state === "closed" ? (
        <p role="alert" className="mp-alert mp-alert--danger">
          <CircleAlert size={16} aria-hidden="true" />
          {t(state === "unknown" ? "after.designs.unknown" : "after.designs.closed")}
        </p>
      ) : null}
      <YourDesigns
        api={port.customiser()}
        held={held}
        codes={codesNow()}
        locale={locale}
        look="print"
        shop={works}
        onOpen={(design) => void openDesign(design)}
        onOrder={(design) => void openDesign(design)}
        onForget={(gone) => useShop.setState({ held: useShop.getState().held.filter((one) => String(one.id) !== String(gone.id)) })}
        onChoose={() => goView("products")}
      />
    </section>
  );
}

/** A saved design's own link in the address bar (`/design#<code>`), opened once and taken off it. */
function useDesignLink(ready: boolean): "idle" | "opened" | "unknown" | "closed" {
  const [state, setState] = useState<"idle" | "opened" | "unknown" | "closed">("idle");
  useEffect(() => {
    if (!ready) return;
    const token = window.location.hash.replace(/^#/, "").split("&")[0] ?? "";
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    void openDesignLink(token).then(setState);
  }, [ready]);
  return state;
}

/** The sign-in link's page: "Hello, Harbour" and Continue; the link is spent only on Continue. */
export function SignInScreen() {
  const { t } = useI18n();
  const port = useShop((s) => s.port);
  const signIn = useAfter((s) => s.signIn);
  useEffect(() => {
    if (port === null) return;
    const token = window.location.hash.replace(/^#/, "").split("&")[0] ?? "";
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    void peekSignIn(token);
  }, [port]);
  const used = signIn.state === "used" || (signIn.state === "idle" && signIn.token === null);
  return (
    <section className="mp-screen ma-page ma-signin" aria-labelledby="ma-signin-title">
      <span className="ma-icon ma-icon--big">
        <UserRoundCheck size={22} aria-hidden="true" />
      </span>
      <h1 id="ma-signin-title" className="mp-h1">
        {signIn.state === "peeking" ? t("after.signin.checking") : used ? t("after.signin.usedTitle") : signIn.name === null ? t("after.signin.hello") : t("after.signin.helloName", { name: signIn.name })}
      </h1>
      <p className="mp-lede">{used ? t("after.signin.used") : t("after.signin.body")}</p>
      {used ? (
        <button type="button" className="mp-button mp-button--accent" onClick={() => goView("order")}>
          {t("shop.nav.follow")}
        </button>
      ) : (
        <button type="button" className="mp-button mp-button--accent" aria-busy={signIn.state === "opening" || signIn.state === "peeking" || undefined} onClick={() => void continueSignIn()}>
          {signIn.state === "opening" ? t("after.signin.opening") : t("after.signin.continue")}
        </button>
      )}
    </section>
  );
}
