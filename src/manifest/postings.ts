/**
 * What the works' rows hand the Customiser, and when.
 *
 * A job that names a customer's design posts it into the Customiser's
 * `designs` ledger when the job is made with its order: the Customiser keeps
 * the design as ordered (the version the proofs and the print files are drawn
 * from) and locks the customer's draft, in the same save. A design ordered
 * again without a change gets no second version. This is the Customiser's own
 * snippet, as its README gives it.
 */
export const CUSTOMISER = "customiser";

export const DESIGN_POSTING = {
  id: "design",
  into: { addOn: CUSTOMISER, ledger: "designs", action: "order" },
  via: "order_id",
  post: { on: { create: true } },
  map: { design: "design_id" },
  only: { column: "design_id", set: true },
};
