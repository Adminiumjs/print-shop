/**
 * Small pieces the shop's screens share: a product's icon by the name its row
 * keeps, a family's tint, and a sentence with a figure set in mono inside it.
 */
import { CreditCard, FileText, Flag, Image, Mail, Printer, Sticker, type LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import type { MessageKey, TFunction } from "../i18n/index.tsx";

/** The icons a product row may name (`products.icon`), by lucide's names. */
const ICONS: Record<string, LucideIcon> = {
  "credit-card": CreditCard,
  "file-text": FileText,
  mail: Mail,
  sticker: Sticker,
  image: Image,
  flag: Flag,
};

export function ProductIcon({ name, size }: { name: string | null; size: number }) {
  const Icon = (name === null ? undefined : ICONS[name]) ?? Printer;
  return <Icon size={size} aria-hidden="true" />;
}

const FAMILIES = ["card", "paper", "mail", "sticker", "image", "banner"];

/** A product family's tint class. */
export const tintOf = (family: string): string => `mp-tint--${FAMILIES.includes(family) ? family : "other"}`;

/** The families the products page names, as message keys. */
export const familyKey = (family: string): MessageKey => (FAMILIES.includes(family) ? `shop.family.${family}` : "shop.family.other") as MessageKey;

/**
 * A sentence with parts that are not plain words: the template is the
 * message itself, and each `{name}` in it is replaced by the node given, so
 * a translation may put the figure anywhere in its own sentence.
 */
export function rich(t: TFunction, key: MessageKey, nodes: Record<string, ReactNode>, params?: Record<string, string | number>, count?: number): ReactNode {
  const template = t(key, params, count);
  const parts = template.split(/(\{\w+\})/g);
  return parts.map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={i}>{name !== undefined && name in nodes ? nodes[name] : part}</Fragment>;
  });
}
