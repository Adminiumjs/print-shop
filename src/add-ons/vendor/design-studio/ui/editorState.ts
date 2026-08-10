/*
 * VENDORED from add-ons/packages/design-studio/src/ui/editorState.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The editor's session state, as a pure reducer over the document engine.
 *
 * A canvas editor is the place where React state normally goes wrong: a drag
 * fires a move per pointer sample, and reading the current document out of a
 * closure that was captured on pointer-down gives you the document as it was
 * sixty samples ago. Routing every change through one reducer removes the
 * question — the reducer always sees the latest state, and the view only has to
 * turn a pointer position into millimetres.
 *
 * SESSION, NOT DOCUMENT. Which side is showing, what is selected, which snap
 * lines are lit and which notice is up all describe the person editing, not the
 * artwork. None of it is exported by `toArtworkRef()` and none of it belongs in
 * `Doc` — which is why undo steps through documents and never through
 * selections. Undoing a click is not a thing anybody wants.
 */

import {
  alignToPage,
  addLayer,
  commit,
  createHistory,
  distribute,
  endGesture,
  moveLayer,
  moveZ,
  redo,
  removeLayer,
  setHidden,
  undo,
  updateLayer,
  type Doc,
  type History,
  type Layer,
  type LayerDraft,
  type PageAlign,
  type Side,
  type SnapLine,
  type ZMove,
} from "../doc.ts";

export interface EditorState {
  history: History;
  side: Side;
  selected: string | null;
  /** Lit only while a snap is engaged; cleared on pointer-up. */
  snapLines: SnapLine[];
  /** An i18n key for the one thing the editor ever has to say back. */
  notice: string | null;
}

export type EditorAction =
  | { type: "open"; doc: Doc }
  | { type: "side"; side: Side }
  | { type: "select"; id: string | null }
  | { type: "drag"; id: string; xMm: number; yMm: number; zoom: number }
  | { type: "endGesture" }
  | { type: "add"; draft: LayerDraft }
  | { type: "patch"; patch: Partial<Omit<Layer, "id" | "kind">>; token?: string }
  | { type: "delete" }
  | { type: "toggleHidden"; id: string }
  | { type: "z"; move: ZMove }
  | { type: "alignPage"; align: PageAlign }
  | { type: "distribute"; axis: "x" | "y" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "dismissNotice" };

export function initialState(doc: Doc): EditorState {
  return { history: createHistory(doc), side: "front", selected: null, snapLines: [], notice: null };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const doc = state.history.present;

  switch (action.type) {
    case "open":
      return initialState(action.doc);

    case "side":
      // Selection does not survive the flip: the thing that was selected is on
      // the other side of the sheet and the inspector would be editing
      // something the customer cannot see.
      return { ...state, side: action.side, selected: null, snapLines: [] };

    case "select":
      return { ...state, selected: action.id, notice: null };

    case "drag": {
      const { doc: next, lines } = moveLayer(doc, action.id, action.xMm, action.yMm, action.zoom);
      return {
        ...state,
        // One token for the whole gesture — sixty samples, one undo step.
        history: commit(state.history, next, `drag:${action.id}`),
        selected: action.id,
        snapLines: lines,
      };
    }

    case "endGesture":
      return { ...state, history: endGesture(state.history), snapLines: [] };

    case "add": {
      const { doc: next, id } = addLayer(doc, state.side, action.draft);
      return { ...state, history: commit(state.history, next), selected: id, notice: null };
    }

    case "patch": {
      if (state.selected === null) return state;
      const next = updateLayer(doc, state.selected, action.patch);
      // Typing a name coalesces the same way a drag does: one token per field,
      // cleared on blur, so a twelve-letter name is one undo rather than twelve.
      return { ...state, history: commit(state.history, next, action.token) };
    }

    case "delete": {
      if (state.selected === null) return state;
      return {
        ...state,
        history: commit(state.history, removeLayer(doc, state.selected)),
        selected: null,
      };
    }

    case "toggleHidden": {
      const layer = doc.layers.find((l) => l.id === action.id);
      if (layer === undefined) return state;
      return { ...state, history: commit(state.history, setHidden(doc, action.id, !layer.hidden)) };
    }

    case "z": {
      if (state.selected === null) return state;
      return { ...state, history: commit(state.history, moveZ(doc, state.selected, action.move)) };
    }

    case "alignPage": {
      if (state.selected === null) return state;
      return { ...state, history: commit(state.history, alignToPage(doc, state.selected, action.align)) };
    }

    case "distribute": {
      const result = distribute(doc, state.side, action.axis);
      if (!result.ok) {
        // The refusal carries its reason all the way to the screen. A disabled
        // button that says nothing is the failure this whole app avoids.
        return { ...state, notice: "addon.design-studio.insp.spreadNeedsThree" };
      }
      return { ...state, history: commit(state.history, result.doc), notice: null };
    }

    case "undo": {
      const history = undo(state.history);
      return { ...state, history, selected: stillThere(history.present, state.selected), snapLines: [] };
    }

    case "redo": {
      const history = redo(state.history);
      return { ...state, history, selected: stillThere(history.present, state.selected), snapLines: [] };
    }

    case "dismissNotice":
      return { ...state, notice: null };
  }
}

/** A selection that an undo has just deleted out from under is no selection. */
function stillThere(doc: Doc, id: string | null): string | null {
  return id !== null && doc.layers.some((l) => l.id === id) ? id : null;
}
