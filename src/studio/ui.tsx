/**
 * The small pieces every works screen draws with: a product's icon, its
 * family's tint and dot, a ready-by chip, a customer's own words.
 */
import type { ReactNode } from "react";
import { CreditCard, FileText, Flag, Image, Mail, Package, Sticker, type LucideIcon } from "lucide-react";

import { useT, type MessageKey } from "../i18n/index.tsx";
import { useFmt } from "./format.ts";
import type { DueTone } from "./facts.ts";

/** The icons a product's row may name (`products.icon`), by their lucide names. */
const ICONS: Readonly<Record<string, LucideIcon>> = {
  "credit-card": CreditCard,
  "file-text": FileText,
  mail: Mail,
  sticker: Sticker,
  image: Image,
  flag: Flag,
  package: Package,
};

/** The families the products are tinted by (`products.family`). */
const FAMILIES = new Set(["card", "paper", "mail", "sticker", "image", "banner"]);
export const familyClass = (family: string): string => (FAMILIES.has(family) ? family : "other");

/** A product's icon by the name its row gives; a parcel when the name is not one of them. */
export function ProductIcon({ name, size = 16 }: { name: string | null | undefined; size?: number }) {
  const Found = ICONS[name ?? "package"] ?? Package;
  return <Found size={size} aria-hidden="true" focusable="false" />;
}

/** A family's tile: its tint, with the product's icon on it. */
export function FamilyTile({ family, icon, size = "md" }: { family: string; icon: string | null | undefined; size?: "md" | "lg" }) {
  return (
    <span className={`wk-tile wk-tile--${size} wk-tint--${familyClass(family)}`} aria-hidden="true">
      <ProductIcon name={icon} size={size === "lg" ? 22 : 16} />
    </span>
  );
}

/** A family's dot, the colour its cards carry. */
export function FamilyDot({ family }: { family: string }) {
  return <span className={`wk-dot wk-dot--${familyClass(family)}`} aria-hidden="true" />;
}

const DUE_KEY: Record<Exclude<DueTone, "later" | "next">, MessageKey> = {
  ready: "works.due.ready",
  overdue: "works.due.overdue",
  today: "works.due.today",
  tomorrow: "works.due.tomorrow",
  none: "works.due.none",
};

/** The words of a ready-by chip, as the board and the ticket say it. */
export function useDueLabel(): (tone: DueTone, day: string | null) => string {
  const t = useT();
  const fmt = useFmt();
  return (tone, day) => (tone === "later" ? t("works.due.on", { day: fmt.day(day) }) : tone === "next" ? t("works.due.weekday", { day: fmt.weekday(day) }) : t(DUE_KEY[tone]));
}

/** A ready-by chip: ready, overdue, due today, tomorrow or on the next working day, or the day. */
export function DueChip({ tone, day, big = false }: { tone: DueTone; day: string | null; big?: boolean }) {
  const label = useDueLabel();
  return <span className={`wk-due wk-due--${tone}${big ? " wk-due--big" : ""}`}>{label(tone, day)}</span>;
}

/** Words a customer typed, isolated so a name in another script reads the right way round. */
export function Typed({ children }: { children: ReactNode }) {
  return <bdi>{children}</bdi>;
}

/** Mono figures, kept left to right inside a right-to-left page. */
export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`wk-mono ${className}`}>{children}</span>;
}
