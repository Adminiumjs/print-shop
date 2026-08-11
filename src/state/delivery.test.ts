/**
 * The delivery decision, which used to be two dead controls.
 *
 * The checkout held a local `useState` for "standard or collect" that nothing
 * read, beside an add-on slot whose carrier rows kept a selection of their own
 * that nothing read either. Both looked live. A customer could press a carrier
 * rate, watch the radio dot fill, and buy standard delivery from the works.
 *
 * These are the assertions that make the control a control: the host learns
 * what was chosen, one choice unmakes the other, the money follows, and
 * switching the add-on off takes its quote with it (D6, D16).
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { fileFromRef } from '../add-ons/artwork.ts';
import { useStore, worksBandFor, type DeliveryChoice } from './store.ts';

/*
 * A NEUTRAL add-on key on purpose. `addOn` is opaque to the host — it is stored
 * and handed back, and not one of the eight assertions below depends on its
 * value — so naming the real carrier here would have made this suite read as a
 * test of that carrier's integration when it is a test of the host's seam. If
 * a future edit makes an assertion care what this string is, the seam has
 * stopped being a seam.
 */
const CHOICE: DeliveryChoice = {
  addOn: 'a-delivery-add-on',
  code: 'economy',
  label: 'Economy, second working day',
  amount: 9.4,
  currency: 'USD',
  estimatedDelivery: '2026-08-07',
};

function seedBasket(): void {
  useStore.getState().startConfigure('business-cards');
  useStore.getState().addToBasket();
}

beforeEach(() => {
  useStore.setState({
    basket: [],
    config: null,
    deliveryChoice: null,
    enabled: new Set<string>(),
  });
});

describe('one decision, one place', () => {
  it('starts with the works delivering it, and says so from the LINES', () => {
    // Derived, not stored twice. A checkout that held its own "standard" while
    // the engine priced the line as collection is how the two got out of step.
    expect(useStore.getState().deliveryChoice).toBeNull();
    seedBasket();
    expect(worksBandFor(useStore.getState().basket)).toBe('collect');
    useStore.getState().chooseWorksDelivery('standard');
    expect(worksBandFor(useStore.getState().basket)).toBe('standard');
  });

  it('records what an add-on quoted, rather than letting the fill remember it', () => {
    useStore.getState().chooseAddOnDelivery(CHOICE);
    expect(useStore.getState().deliveryChoice).toEqual(CHOICE);
  });

  it('unselects the built-in choice when a carrier rate is chosen, and back again', () => {
    seedBasket();
    useStore.getState().chooseAddOnDelivery(CHOICE);
    expect(useStore.getState().deliveryChoice).toEqual(CHOICE);

    useStore.getState().chooseWorksDelivery('collect');
    // Not "both selected" and not "the carrier still quietly held": the choice
    // is gone and the lines say what the works is doing.
    expect(useStore.getState().deliveryChoice).toBeNull();
    expect(worksBandFor(useStore.getState().basket)).toBe('collect');
  });
});

describe('the money follows the choice', () => {
  it('stops charging the works’ own delivery band when a carrier is chosen', () => {
    seedBasket();
    useStore.getState().chooseWorksDelivery('standard');
    expect(useStore.getState().basket.map((l) => l.config.delivery)).toEqual(['band-2kg']);

    useStore.getState().chooseAddOnDelivery(CHOICE);
    // Otherwise the same parcel is billed twice: once by the works' weight band
    // inside the line price, once by the carrier in the summary.
    expect(useStore.getState().basket.map((l) => l.config.delivery)).toEqual(['collection']);
  });

  it('charges nothing for collection', () => {
    seedBasket();
    useStore.getState().chooseWorksDelivery('collect');
    expect(useStore.getState().basket.map((l) => l.config.delivery)).toEqual(['collection']);
  });

  it('re-prices every line, not just the last one', () => {
    seedBasket();
    seedBasket();
    useStore.getState().chooseWorksDelivery('collect');
    const lines = useStore.getState().basket;
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.config.delivery === 'collection')).toBe(true);
  });
});

describe('switching the add-on off takes its quote with it (D6)', () => {
  it('falls back to the works’ own delivery when the quoting add-on is disconnected', () => {
    seedBasket();
    useStore.setState({ enabled: new Set([CHOICE.addOn]) });
    useStore.getState().chooseAddOnDelivery(CHOICE);

    useStore.getState().disconnectAddOn(CHOICE.addOn);

    // A price quoted by a company that is no longer connected, sitting on a
    // basket nobody has paid for, is exactly the leftover D6 forbids — and the
    // lines land on the base state, not on a plausible neighbouring one.
    expect(useStore.getState().deliveryChoice).toBeNull();
    expect(useStore.getState().basket.map((l) => l.config.delivery)).toEqual(['collection']);
    expect(worksBandFor(useStore.getState().basket)).toBe('collect');
  });

  it('leaves the decision alone when a different add-on is disconnected', () => {
    seedBasket();
    useStore.setState({ enabled: new Set([CHOICE.addOn, 'design-studio']) });
    useStore.getState().chooseAddOnDelivery(CHOICE);

    useStore.getState().disconnectAddOn('design-studio');

    expect(useStore.getState().deliveryChoice).toEqual(CHOICE);
  });
});

/**
 * ── A QUOTE IS A LEFTOVER; A DESIGN IS THE CUSTOMER'S (24 D16) ──────────────
 *
 * [Added 2026-08-11, wave 4b round 4.] `disconnectAddOn` used to null
 * `suppliedArtwork` alongside the delivery quote, on the reasoning that both
 * were half-finished flows the add-on had left on a host screen. Driven live,
 * the two behave nothing alike: a design made in the editor survives navigating
 * away and back, and then a disconnect-and-reconnect in the dock loses it for
 * good.
 *
 * D16 is one sentence — a disconnect keeps the data and deletes the credentials
 * — and a file a customer made, named and had measured is data. The rate row is
 * not: it is a PRICE A DISCONNECTED COMPANY QUOTED, on a basket nobody has paid
 * for, and the shop can no longer honour it.
 *
 * The two cases are asserted together, in one suite, because the interesting
 * thing is the DIFFERENCE and a reader has to be able to see both rules at once.
 */
describe('what a disconnect keeps, and what it cannot (D16)', () => {
  /*
   * Built the way the app builds one — `fileFromRef` on an `artwork-source@1`
   * reference — rather than typed out here, so the fixture cannot describe a
   * file the contract could not produce.
   */
  const FILE = fileFromRef({
    fileId: 'ds-1ca8ee4a.pdf',
    source: 'design-studio',
    widthMm: 97,
    heightMm: 67,
    bleedMm: 3,
    dpi: 300,
    pages: 1,
  });

  it('keeps a design the add-on made, after the add-on is switched off', () => {
    useStore.setState({ enabled: new Set(['design-studio']) });
    useStore.getState().supplyArtwork(FILE, 'design-studio');

    useStore.getState().disconnectAddOn('design-studio');

    const supplied = useStore.getState().suppliedArtwork;
    expect(supplied, 'the customer’s own design was deleted by a disconnect').not.toBeNull();
    expect(supplied!.file.filename).toBe(FILE.filename);
    // And it still remembers WHERE it came from, which is what lets the artwork
    // screen keep saying "From …" honestly. `registry.byKey` answers for a
    // registered add-on whether or not it is enabled (D6).
    expect(supplied!.source).toBe('design-studio');
  });

  it('keeps it when a DIFFERENT add-on is switched off, too', () => {
    useStore.setState({ enabled: new Set(['design-studio', CHOICE.addOn]) });
    useStore.getState().supplyArtwork(FILE, 'design-studio');

    useStore.getState().disconnectAddOn(CHOICE.addOn);

    expect(useStore.getState().suppliedArtwork?.file.filename).toBe(FILE.filename);
  });

  it('still drops the rate a disconnected company quoted', () => {
    // The other half of the rule, restated here so deleting the line above
    // cannot be made to pass by deleting the distinction.
    seedBasket();
    useStore.setState({ enabled: new Set([CHOICE.addOn]) });
    useStore.getState().supplyArtwork(FILE, 'design-studio');
    useStore.getState().chooseAddOnDelivery(CHOICE);

    useStore.getState().disconnectAddOn(CHOICE.addOn);

    expect(useStore.getState().deliveryChoice).toBeNull();
    expect(useStore.getState().suppliedArtwork).not.toBeNull();
  });
});
