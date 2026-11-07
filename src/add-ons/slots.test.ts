/**
 * The artwork screen's `artwork.sources` slot stays declared.
 *
 * Two published add-ons fill it on this app: Design Studio ("Design it here",
 * attached to `printing` at `^0.1.0 || ^0.2.0`) and Import from Canva. Both are
 * retired here (the Customiser took Design Studio's place, and a Canva design
 * comes in as its print PDF), but a works still running either keeps it
 * attached across every 0.2 release Design Studio's range takes. Dropping the
 * slot breaks them with no error anywhere in this repo: the add-ons' own
 * manifests still name it, and their fills simply never render.
 */
import { describe, expect, it } from "vitest";

import { HOSTED_SLOTS, isHosted, SLOT_EMPTY_BEHAVIOUR, SLOT_FILL, SLOT_IDS } from "./slots.ts";

const WHY =
  "`artwork.sources` must stay declared in src/add-ons/slots.ts: Design Studio attaches to printing at `^0.1.0 || ^0.2.0` and fills it, and Import from Canva fills it too. " +
  "Removing it breaks a works still running either add-on. Retire the slot only with a minor that leaves Design Studio's range, and say so in the release notes.";

describe("the artwork screen's slot for other ways to send artwork", () => {
  it("stays declared as a slot this app hosts, which says so in words when nothing fills it and takes every fill", () => {
    expect(SLOT_IDS, WHY).toContain("artwork.sources");
    expect(HOSTED_SLOTS, WHY).toContain("artwork.sources");
    expect(isHosted("artwork.sources"), WHY).toBe(true);
    expect(SLOT_EMPTY_BEHAVIOUR["artwork.sources"], WHY).toBe("speaks");
    expect(SLOT_FILL["artwork.sources"], WHY).toBe("multi");
  });
});
