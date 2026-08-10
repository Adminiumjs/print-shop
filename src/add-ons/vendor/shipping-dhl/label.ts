/*
 * VENDORED from add-ons/packages/shipping-dhl/src/label.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The label the demo transport hands back.
 *
 * It is a REAL PDF — a single 4×6in page assembled byte by byte — because the
 * dispatch screen offers Download and Print, and a tile that downloads nothing
 * is a screenshot rather than a feature. It is also unmistakably not a shipping
 * label: the first line on the page says so, there is no barcode, and nothing
 * here draws or approximates a carrier's mark (24 D12).
 *
 * The generator is deterministic in the strict sense — same shipment, same
 * bytes — which is what lets `FileRef.bytes` be asserted in a test. That means
 * no timestamp in the document, which is also why the PDF carries no
 * `/CreationDate`: a date stamped from a real clock would make the file differ
 * between two runs of the same demo.
 */

/** Text inside a PDF string literal escapes exactly three characters. */
function pdfText(value: string): string {
  return value.replace(/([\\()])/g, "\\$1");
}

export interface LabelFacts {
  tracking: string;
  service: string;
  reference: string;
  collection: string;
  delivery: string;
  to: { name: string; lines: readonly string[]; city: string; postcode: string; country: string };
  from: { name: string; city: string; postcode: string; country: string };
}

/**
 * Lay the page out as (y, size, weight, text) rows and let the writer turn them
 * into a content stream, so adding a line to the label is one array entry
 * rather than an offset calculation.
 */
function lines(facts: LabelFacts): { y: number; size: number; bold: boolean; text: string }[] {
  const to = [facts.to.name, ...facts.to.lines, facts.to.city, facts.to.postcode, facts.to.country];
  const rows: { y: number; size: number; bold: boolean; text: string }[] = [
    { y: 400, size: 9, bold: true, text: "DEMO LABEL - NOT VALID FOR CARRIAGE" },
    { y: 386, size: 7, bold: false, text: "Made by a seeded stand-in. No shipment exists." },
    { y: 360, size: 8, bold: false, text: `Carrier   DHL (simulated)` },
    { y: 348, size: 8, bold: false, text: `Service   ${facts.service}` },
    { y: 336, size: 8, bold: false, text: `Order     ${facts.reference}` },
    { y: 318, size: 7, bold: false, text: "TRACKING" },
    { y: 300, size: 14, bold: true, text: facts.tracking },
    { y: 274, size: 7, bold: false, text: "DELIVER TO" },
  ];

  let y = 258;
  for (const row of to) {
    rows.push({ y, size: 10, bold: false, text: row });
    y -= 14;
  }

  rows.push(
    { y: y - 12, size: 7, bold: false, text: "SENDER" },
    {
      y: y - 26,
      size: 8,
      bold: false,
      text: `${facts.from.name}, ${facts.from.city} ${facts.from.postcode} ${facts.from.country}`,
    },
    { y: 40, size: 8, bold: false, text: `Collection ${facts.collection}` },
    { y: 28, size: 8, bold: false, text: `Due        ${facts.delivery}` },
  );

  return rows;
}

function contentStream(facts: LabelFacts): string {
  const body = lines(facts)
    .map(
      (row) =>
        `BT /${row.bold ? "F2" : "F1"} ${row.size} Tf 18 ${row.y} Td (${pdfText(row.text)}) Tj ET`,
    )
    .join("\n");
  // A hairline rule under the header, so the page reads as a label rather than
  // a memo. One graphics operator is cheaper than an image and embeds nothing.
  return `0.6 w\n18 376 m 270 376 l S\n${body}\n`;
}

/**
 * A minimal PDF 1.4 file.
 *
 * The cross-reference table needs each object's byte offset, so the objects are
 * concatenated in order while the offsets are collected — which is the whole
 * reason this is written as a loop rather than a template literal. Every byte
 * is ASCII, so `String.length` is the byte length and the offsets are exact.
 */
export function renderLabelPdf(facts: LabelFacts): string {
  const stream = contentStream(facts);
  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 288 432]/Resources<</Font<</F1 4 0 R/F2 5 0 R>>>>/Contents 6 0 R>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>",
    `<</Length ${stream.length}>>\nstream\n${stream}endstream`,
  ];

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) out += `${String(offset).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

/** `00 3400 1234 5678 9012` → a filename that survives a shell and a download. */
export function labelFilename(tracking: string): string {
  return `dhl-label-${tracking.replace(/\s+/g, "-")}.pdf`;
}
