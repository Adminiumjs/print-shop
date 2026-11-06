/**
 * The configurator's choices and the rules that shape them, read from the
 * rate card's own rows: which options a product offers (`options`), which
 * finish is not offered on what (`option_rules`), the quantity breaks, the
 * packaging, and a large-format job's limits. Nothing here prices anything:
 * the choices become a job's values, and Adminium answers what they cost.
 */
import type { Catalogue, Id, JobValues, Material, Option, OptionKind, Product, Row, Rule } from "./port.ts";

/** What a customer chose on a product's page: each of its own options by id, and how many. */
export interface Choice {
  materialId: Id | null;
  sizeId: Id | null;
  /** A large-format job's own size, in millimetres. */
  width: number | null;
  height: number | null;
  sidesId: Id | null;
  laminationId: Id | null;
  look: "gloss" | "matt";
  spotUvId: Id | null;
  cornersId: Id | null;
  edgesId: Id | null;
  canvasId: Id | null;
  packagingId: Id | null;
  proof: boolean;
  express: boolean;
  qty: number;
}

/** The finishes a job takes at most one of each, as the option kinds name them. */
export type FinishKind = "lamination" | "spot_uv" | "corners" | "edges" | "canvas";

const FINISH_FIELD: Record<FinishKind, keyof Choice> = {
  lamination: "laminationId",
  spot_uv: "spotUvId",
  corners: "cornersId",
  edges: "edgesId",
  canvas: "canvasId",
};

/** The largest a large-format job is made along the roll, and the least on either side: the job's own columns' limits. */
export const LARGE_MAX_MM = 5000;
export const LARGE_MIN_MM = 50;
/** The most of one large-format job, which takes no quantity breaks. */
export const LARGE_MAX_QTY = 20;
/** The most of one sheet job the page takes in one line. */
export const SHEET_MAX_QTY = 100000;

const same = (a: Id | null | undefined, b: Id | null | undefined) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

export function optionsOf(catalogue: Catalogue, productId: Id, kind: OptionKind): Option[] {
  return catalogue.options.filter((o) => same(o.productId, productId) && o.kind === kind);
}

export function optionById(catalogue: Catalogue, id: Id | null): Option | null {
  return id === null ? null : (catalogue.options.find((o) => same(o.id, id)) ?? null);
}

/** The stock a material option names. */
export function materialOf(catalogue: Catalogue, choice: Pick<Choice, "materialId">): Material | null {
  const option = optionById(catalogue, choice.materialId);
  return option === null ? null : (catalogue.materials.find((m) => same(m.id, option.materialId)) ?? null);
}

/** The option a kind starts on: the one the works marked, else its first. */
function startOf(options: Option[]): Id | null {
  return (options.find((o) => o.preselected) ?? options[0])?.id ?? null;
}

/** A product's page as it opens: the works' first choices, nothing finished that need not be, its "from" quantity. */
export function firstChoice(catalogue: Catalogue, product: Product): Choice {
  const of = (kind: OptionKind) => optionsOf(catalogue, product.id, kind);
  const sheet = product.kind === "sheet";
  return {
    materialId: startOf(of("material")),
    sizeId: sheet ? startOf(of("size")) : null,
    width: sheet ? null : (product.defaultWidth ?? 1000),
    height: sheet ? null : (product.defaultHeight ?? 1000),
    sidesId: startOf(of("sides")),
    laminationId: null,
    look: "matt",
    spotUvId: null,
    cornersId: null,
    // Edges and a canvas are always one of their kind: the plain edge, the rolled canvas.
    edgesId: startOf(of("edges")),
    canvasId: startOf(of("canvas")),
    packagingId: sheet ? (packagingFor(catalogue, product)[0]?.id ?? null) : null,
    proof: false,
    express: false,
    qty: sheet ? product.fromQty : 1,
  };
}

/** The packaging a product's work may go in. */
export function packagingFor(catalogue: Catalogue, product: Product) {
  return catalogue.packaging.filter((p) => p.productKind === product.kind);
}

/** The quantities a sheet job's chips offer: the rate card's breaks. Large format has none. */
export function stepsOf(catalogue: Catalogue, product: Product): number[] {
  return product.kind === "sheet" ? catalogue.breaks.map((b) => b.minQty) : [];
}

/** The quantity break after `qty`, or null past the last. */
export function nextStep(catalogue: Catalogue, product: Product, qty: number): number | null {
  return stepsOf(catalogue, product).find((q) => q > qty) ?? null;
}

/** Why a rule stops a finish on this job, or false. */
function applies(rule: Rule, catalogue: Catalogue, choice: Choice): boolean {
  const material = materialOf(catalogue, choice);
  const materialOption = optionById(catalogue, choice.materialId);
  switch (rule.test) {
    case "uncoated":
      return materialOption !== null && !materialOption.coated;
    case "roll":
      return material?.kind === "roll";
    case "no_lamination":
      return choice.laminationId === null;
    case "over_gsm":
      return material !== null && rule.gsm !== null && material.gsm > rule.gsm;
  }
}

/** The reason the works gives for not offering a finish of this kind on this job, or null when it is offered. */
export function finishBlocked(catalogue: Catalogue, choice: Choice, kind: FinishKind): string | null {
  return catalogue.rules.find((rule) => rule.group === kind && applies(rule, catalogue, choice))?.reason ?? null;
}

/**
 * A choice made sound again after a change: a finish the rules no longer
 * offer comes off (and is named, for the page to say so), a size the product
 * does not have goes back to its first, a large-format job keeps a size and
 * a quantity it may have.
 */
export function settle(catalogue: Catalogue, product: Product, choice: Choice): { choice: Choice; dropped: FinishKind[] } {
  const next = { ...choice };
  const dropped: FinishKind[] = [];
  for (const kind of ["lamination", "spot_uv", "corners"] as const) {
    const field = FINISH_FIELD[kind];
    if (next[field] !== null && finishBlocked(catalogue, next, kind) !== null) {
      (next[field] as Id | null) = null;
      dropped.push(kind);
    }
  }
  if (product.kind === "sheet") {
    if (!optionsOf(catalogue, product.id, "size").some((o) => same(o.id, next.sizeId))) next.sizeId = startOf(optionsOf(catalogue, product.id, "size"));
    next.qty = Math.max(1, Math.min(SHEET_MAX_QTY, next.qty));
  } else {
    next.qty = Math.max(1, Math.min(LARGE_MAX_QTY, next.qty));
  }
  return { choice: next, dropped };
}

/** A large-format job's limits: across the roll (or the frame), along it, and the least either side. */
export function sizeLimits(catalogue: Catalogue, product: Product, choice: Choice): { minMm: number; maxWidth: number; maxHeight: number; framed: boolean } {
  const canvas = optionById(catalogue, choice.canvasId);
  const framed = canvas !== null && canvas.code === "stretched" && product.maxWidth !== null;
  const material = materialOf(catalogue, choice);
  return {
    minMm: LARGE_MIN_MM,
    maxWidth: framed ? product.maxWidth! : Math.min(material?.rollWidth ?? LARGE_MAX_MM, product.maxWidth ?? LARGE_MAX_MM),
    maxHeight: framed && product.maxHeight !== null ? product.maxHeight : Math.min(LARGE_MAX_MM, product.maxHeight ?? LARGE_MAX_MM),
    framed,
  };
}

export type SizeProblem = { side: "width" | "height"; kind: "under" | "over"; fix: number };

/** What is wrong with a large-format job's size, each with the size that puts it right. */
export function sizeProblems(catalogue: Catalogue, product: Product, choice: Choice): SizeProblem[] {
  if (product.kind !== "large") return [];
  const limits = sizeLimits(catalogue, product, choice);
  const out: SizeProblem[] = [];
  const check = (side: "width" | "height", value: number | null, max: number) => {
    const v = value ?? 0;
    if (v < limits.minMm) out.push({ side, kind: "under", fix: limits.minMm });
    else if (v > max) out.push({ side, kind: "over", fix: max });
  };
  check("width", choice.width, limits.maxWidth);
  check("height", choice.height, limits.maxHeight);
  return out;
}

/** The job's values as the order's job row takes them, at a quantity. */
export function jobValues(catalogue: Catalogue, product: Product, choice: Choice, qty: number = choice.qty): JobValues {
  const sheet = product.kind === "sheet";
  const put = <K extends keyof JobValues>(key: K, value: JobValues[K] | null | undefined) => (value === null || value === undefined ? {} : { [key]: value });
  const lamination = optionById(catalogue, choice.laminationId);
  return {
    product_id: product.id,
    qty,
    material_option_id: choice.materialId as Id,
    sides_option_id: choice.sidesId as Id,
    ...put("size_option_id", sheet ? choice.sizeId : null),
    ...put("width_mm", sheet ? null : choice.width),
    ...put("height_mm", sheet ? null : choice.height),
    ...put("lamination_option_id", choice.laminationId),
    // Gloss and matt are a look of a lamination of one side or both, at the same price; soft-touch has none.
    ...put("look", lamination !== null && lamination.code !== "lam-soft" ? choice.look : null),
    ...put("spot_uv_option_id", choice.spotUvId),
    ...put("corners_option_id", choice.cornersId),
    ...put("edges_option_id", sheet ? null : choice.edgesId),
    ...put("canvas_option_id", sheet ? null : choice.canvasId),
    ...put("packaging_id", sheet ? choice.packagingId : null),
    proof_by_post: choice.proof,
    express: choice.express,
  };
}

/** How many sides the job prints: its sides option's. */
export function sidesOf(catalogue: Catalogue, choice: Choice): 1 | 2 {
  return optionById(catalogue, choice.sidesId)?.sides === 2 ? 2 : 1;
}

/** The finished size of the job, in millimetres: its preset's, or its own. */
export function trimOf(catalogue: Catalogue, product: Product, choice: Choice): { w: number; h: number } | null {
  if (product.kind === "large") return choice.width === null || choice.height === null ? null : { w: choice.width, h: choice.height };
  const option = optionById(catalogue, choice.sizeId);
  const preset = option === null ? null : catalogue.sizes.find((s) => same(s.id, option.sizeId));
  return preset === undefined || preset === null ? null : { w: preset.width, h: preset.height };
}

/**
 * A job or a quote line as it was configured, as the configurator takes it
 * again: each option the row names if the product still offers it, else the
 * works' first; then settled by today's rules (a finish no longer offered on
 * that stock comes off).
 */
export function choiceOf(catalogue: Catalogue, product: Product, row: Row): Choice {
  const start = firstChoice(catalogue, product);
  const kept = (kind: OptionKind, column: string, fallback: Id | null): Id | null => {
    const value = row[column];
    if (value === null || value === undefined || value === "") return kind === "material" || kind === "sides" || kind === "size" ? fallback : null;
    return optionsOf(catalogue, product.id, kind).some((o) => same(o.id, value as Id)) ? (value as Id) : fallback;
  };
  const truthy = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";
  const packaging = row["packaging_id"];
  const sheet = product.kind === "sheet";
  const choice: Choice = {
    materialId: kept("material", "material_option_id", start.materialId),
    sizeId: sheet ? kept("size", "size_option_id", start.sizeId) : null,
    width: sheet ? null : Number(row["width_mm"] ?? start.width),
    height: sheet ? null : Number(row["height_mm"] ?? start.height),
    sidesId: kept("sides", "sides_option_id", start.sidesId),
    laminationId: kept("lamination", "lamination_option_id", null),
    look: row["look"] === "gloss" ? "gloss" : "matt",
    spotUvId: kept("spot_uv", "spot_uv_option_id", null),
    cornersId: kept("corners", "corners_option_id", null),
    edgesId: sheet ? null : kept("edges", "edges_option_id", start.edgesId),
    canvasId: sheet ? null : kept("canvas", "canvas_option_id", start.canvasId),
    packagingId: sheet && packagingFor(catalogue, product).some((p) => same(p.id, packaging as Id)) ? (packaging as Id) : start.packagingId,
    proof: truthy(row["proof_by_post"]),
    express: truthy(row["express"]),
    qty: Math.max(1, Number(row["qty"] ?? start.qty)),
  };
  return settle(catalogue, product, choice).choice;
}
