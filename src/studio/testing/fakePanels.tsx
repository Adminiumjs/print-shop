/**
 * A stand-in for the Customiser's panels' door: the add-on's rows in memory,
 * every call recorded, and a panel that is built the way the Customiser's
 * real ones are, reading React and the host API from the global the works' screens
 * publishes (never importing the host), so a screen test draws a panel
 * through the same seam a served bundle uses.
 *
 * Tests only; nothing that ships imports it.
 */
import type { ReactNode } from "react";

import type { Action, PanelDoor, PanelList, PanelOpen, PanelUploaded } from "../door.ts";
import { ApiError, same, type Id, type Row } from "../wire.ts";
import { installRuntime, PanelRefused } from "../../add-ons/connected.ts";
import { PANEL_HOST } from "../panels/host.tsx";

type Host = typeof PANEL_HOST;
type Props = { connectionId: string; table: string; row: string; linked: string | null };

/** The host the works' screens published, read as a bundle reads it. */
const published = (): Host => (globalThis as unknown as { __ADMINIUM_ADD_ON_RUNTIME__: { host: Host } }).__ADMINIUM_ADD_ON_RUNTIME__.host;

/** A job's panel in miniature: the design read, its version listed, the proof made and stored. */
function LinePanel({ linked }: Props): ReactNode {
  const { data, ui, app } = published();
  const t = app.registerMessages("customiser", { "en-US": { "panel.title": "Customising", "panel.make.proof": "Make the proof", "panel.versions": "{n, plural, one {# version} other {# versions}}" } });
  const toasts = app.useAppToasts();
  const design = data.useRecord("designs", linked);
  const versions = data.useRecords("design_versions", { filter: [{ column: "design_id", op: "eq", value: linked }], sort: [{ column: "version", direction: "desc" }], enabled: linked !== null });
  const upload = data.useUpload("design_versions", "proof_file");
  const latest = versions.rows[0];
  const Image = app.lucideByName("image");
  if (design.row === null) return <ui.EmptyState title="No design on this job" />;
  return (
    <data.Card title={t("panel.title", "Customising")} actions={<data.StatusPill tone="info">{t("panel.versions", "", { n: versions.rows.length })}</data.StatusPill>}>
      <data.Stack gap="md">
        <data.KeyValueList items={[{ label: "Design", value: String(design.row["code"]), mono: true }]} />
        <ui.Button
          variant="primary"
          iconLeft={<Image />}
          disabled={latest === undefined}
          onClick={() =>
            void upload.upload(latest!.id, new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" }), { name: "proof.png" }).then(() => toasts.push({ title: "The proof is made." }), () => undefined)
          }
        >
          {t("panel.make.proof", "Make the proof")}
        </ui.Button>
        {upload.error === null ? null : <p role="alert">{upload.error.message}</p>}
      </data.Stack>
    </data.Card>
  );
}

/** A product's panel in miniature: the base read. */
function ProductPanel({ linked }: Props): ReactNode {
  const { data } = published();
  const base = data.useRecord("bases", linked);
  return <data.Card title="Customising">{base.row === null ? "…" : <data.KeyValueList items={[{ label: "Base", value: String(base.row["name"]) }]} />}</data.Card>;
}

export class FakePanels implements PanelDoor {
  tables: Record<string, Row[]> = {};
  calls: { method: string; args: unknown[] }[] = [];
  /** The panel the next load refuses, with its status (403 not yours, 404 none here). */
  refuseLoad: number | null = null;
  /** The next write of a table refused, as Adminium would. */
  refuseWrite: ApiError | null = null;

  constructor(tables: Record<string, Row[]> = {}) {
    this.tables = tables;
  }

  private rows(table: string): Row[] {
    this.tables[table] ??= [];
    return this.tables[table]!;
  }

  async load(panel: PanelOpen): Promise<unknown> {
    this.calls.push({ method: "load", args: [panel] });
    if (this.refuseLoad !== null) throw new PanelRefused(this.refuseLoad, this.refuseLoad === 403 ? "FORBIDDEN" : "NOT_FOUND", "refused");
    installRuntime(PANEL_HOST);
    return panel.id === "customiser-line" ? LinePanel : ProductPanel;
  }

  async list(addOn: string, table: string, query: PanelList): Promise<Row[]> {
    this.calls.push({ method: "list", args: [addOn, table, query] });
    const where = query.where as { column?: string; value?: unknown } | undefined;
    return this.rows(table).filter((row) => where?.column === undefined || same(row[where.column], where.value));
  }

  async get(addOn: string, table: string, key: Id): Promise<Row | null> {
    this.calls.push({ method: "get", args: [addOn, table, key] });
    return this.rows(table).find((row) => same(row.id, key)) ?? null;
  }

  async create(addOn: string, table: string, values: Record<string, unknown>) {
    this.calls.push({ method: "create", args: [addOn, table, values] });
    const row = { id: 9000 + this.rows(table).length, ...values } as Row;
    this.rows(table).push(row);
    return { data: row };
  }

  async update(addOn: string, table: string, key: Id, values: Record<string, unknown>) {
    this.calls.push({ method: "update", args: [addOn, table, key, values] });
    const list = this.rows(table);
    const at = list.findIndex((row) => same(row.id, key));
    list[at] = { ...list[at]!, ...values };
    return { data: list[at]! };
  }

  async remove(addOn: string, table: string, key: Id): Promise<void> {
    this.calls.push({ method: "remove", args: [addOn, table, key] });
    this.tables[table] = this.rows(table).filter((row) => !same(row.id, key));
  }

  /** What the role may do with each table, by its short name; a table not named here, everything (as when Adminium does not say). */
  rights: Record<string, readonly Action[]> = {};
  access(_addOn: string, table: string): readonly Action[] | null {
    return this.rights[table] ?? null;
  }

  async upload(addOn: string, table: string, column: string, key: Id, file: Blob, name: string): Promise<PanelUploaded> {
    this.calls.push({ method: "upload", args: [addOn, table, column, key, name, file.type] });
    if (this.refuseWrite !== null) {
      const refusal = this.refuseWrite;
      this.refuseWrite = null;
      throw refusal;
    }
    const ref = `file_01J8Z6Q3M4N5P6R7S8T9V0W1${String(this.calls.length).padStart(2, "0")}`;
    const { data } = await this.update(addOn, table, key, { [column]: ref });
    return { ref, id: ref, name, mime: file.type, size: file.size, removed: [], row: data };
  }
}
