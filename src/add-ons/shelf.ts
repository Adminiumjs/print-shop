/**
 * CATALOGUE COPY: the four shelf entries that are described but not built.
 *
 * A demo shelf holding exactly the three add-ons it happens to ship reads as
 * though three is all there could ever be. These four say what a second wave
 * would plausibly hold, in the same plain voice, and each carries a muted
 * "Not in this demo" chip INSTEAD OF a Connect button — a button that does
 * nothing is worse than no button, and a chip that says why is better than
 * both. They fill no slots, ask for no permissions and have no settings,
 * because there is nothing behind them to configure.
 *
 * THEY NAME NO COMPANY, AND THAT IS THE POINT OF THIS FILE EXISTING.
 * They used to read `name: 'Royal Mail Shipping'`, `'Stripe Payments'` and
 * `'Mailchimp Lists'` — three real firms named in the host app's own source for
 * integrations that do not exist. Acceptance criterion 5 says nothing in
 * `printing` names a carrier, and the prescribed grep (`dhl`) sailed straight
 * past all three. Naming a company you do not integrate with is also the one
 * class of wave-4 defect D12 calls a legal problem rather than a taste problem.
 *
 * So each entry now says WHAT IT WOULD DO rather than WHO WOULD DO IT: a second
 * delivery company, a card payment processor, a mailing-list service. The shelf
 * reads exactly as honestly — arguably more so, since "a second delivery
 * company" is the actual claim being made — and the host names no firm at all.
 * The three add-ons that ARE built name their own companies, nominatively, in
 * their own repos, where a `TRADEMARKS.md` sits beside the claim.
 *
 * Their categories come from the closed five (D2) and deliberately use the
 * three that wave 4 does not: payments, email and data exist in the vocabulary
 * so the next wave does not have to reopen it, and a shelf that shows them is
 * how a reader finds that out.
 *
 * `whatKey` repeats `lineKey` on all four because the connect dialog cannot
 * open for something that is not connectable, and inventing a second sentence
 * for a screen nobody can reach would be inventing copy for a product that does
 * not exist.
 *
 * `nameKey` rather than `name`: a real add-on's name is a proper noun and does
 * not translate, but these are DESCRIPTIONS, and a description that stayed in
 * English on an Arabic shelf would be the one untranslated line on the screen.
 */

import type { AddOn } from './host.ts';

export const NOT_IN_THIS_DEMO: readonly AddOn[] = [
  {
    key: 'delivery-second-carrier',
    name: 'A second delivery company',
    nameKey: 'addon.stub.secondCarrier.name',
    shortName: 'Second carrier',
    lineKey: 'addon.stub.secondCarrier.line',
    whatKey: 'addon.stub.secondCarrier.line',
    // Monograms are letters on a neutral tile (D12). With no company to
    // initialise, these initialise the capability instead.
    monogram: 'DEL',
    category: 'delivery',
    connect: 'api-key',
    permissions: [],
    settings: [],
    namesCompany: false,
    noCompanyKeys: ['addon.stub.secondCarrier.noCompany'],
    inDemo: false,
    fills: [],
  },
  {
    key: 'payments-card',
    name: 'A card payment processor',
    nameKey: 'addon.stub.cardPayments.name',
    shortName: 'Card payments',
    lineKey: 'addon.stub.cardPayments.line',
    whatKey: 'addon.stub.cardPayments.line',
    monogram: 'PAY',
    category: 'payments',
    connect: 'oauth2',
    permissions: [],
    settings: [],
    namesCompany: false,
    noCompanyKeys: ['addon.stub.cardPayments.noCompany'],
    inDemo: false,
    fills: [],
  },
  {
    key: 'email-mailing-list',
    name: 'A mailing-list service',
    nameKey: 'addon.stub.mailingList.name',
    shortName: 'Mailing list',
    lineKey: 'addon.stub.mailingList.line',
    whatKey: 'addon.stub.mailingList.line',
    monogram: 'LST',
    category: 'email',
    connect: 'api-key',
    permissions: [],
    settings: [],
    namesCompany: false,
    noCompanyKeys: ['addon.stub.mailingList.noCompany'],
    inDemo: false,
    fills: [],
  },
  {
    key: 'data-sheets-export',
    name: 'Spreadsheet export',
    nameKey: 'addon.stub.sheets.name',
    shortName: 'Spreadsheets',
    lineKey: 'addon.stub.sheets.line',
    whatKey: 'addon.stub.sheets.line',
    monogram: 'CSV',
    category: 'data',
    connect: 'none',
    permissions: [],
    settings: [],
    namesCompany: false,
    noCompanyKeys: ['addon.stub.sheets.noCompany'],
    inDemo: false,
    fills: [],
  },
];
