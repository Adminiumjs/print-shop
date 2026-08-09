-- Print Shop — seed data. GENERATED; do not edit by hand.
--
-- Mirrors src/data/demo.ts row for row: the same seven customers, the same
-- fourteen live jobs MP-4113…MP-4126 and four finished ones, the same nine
-- stock rows with pvc-510 under its reorder point, the same two saved quotes
-- and the same four artwork records — including the letterhead with ink 1.8mm
-- from the trim. Run the app and the generated Adminium dashboard side by side
-- and they show the same Wednesday: the same overdue MP-4118, the same two jobs
-- locked with no proof sent.
--
-- Every price here came out of `priceQuote()` rather than a keyboard, at
-- collection and with no printed proof, which is how all eighteen were sold.
-- `total` is the figure the customer was quoted, tax included.
--
-- Regenerate with:  node db/generate-seed.mjs
--
-- Three sets of values have no counterpart in demo.ts, because the manifest's
-- schema carries columns the TypeScript seed does not: the timestamps
-- (`created_at` is the day a job's first proof went out, or the day before the
-- pinned clock for a job that has none; `updated_at` is the last thing the demo
-- records about it), the fifteen-byte placeholder standing in for each artwork
-- file, and three stock deliveries. All three are derived in
-- db/generate-seed.mjs, where the rules are written down.

BEGIN;

INSERT INTO customers (id, name, email, town, created_at) VALUES
  (1, 'Harbour Bakery', 'orders@harbourbakery.example', 'Marlow', '2026-04-02 09:00:00+01'),
  (2, 'Fenwick & Sons', 'office@fenwickandsons.example', 'Marlow', '2026-04-02 09:00:00+01'),
  (3, 'Bramble Yoga', 'hello@brambleyoga.example', 'Nether Wold', '2026-04-02 09:00:00+01'),
  (4, 'Two Rivers Cycles', 'shop@tworiverscycles.example', 'Marlow', '2026-04-02 09:00:00+01'),
  (5, 'Ostara Flowers', 'post@ostaraflowers.example', 'Kingsbridge', '2026-04-02 09:00:00+01'),
  (6, 'Kestrel Joinery', 'workshop@kestreljoinery.example', 'Nether Wold', '2026-04-02 09:00:00+01'),
  (7, 'The Little Gallery', 'front@thelittlegallery.example', 'Marlow', '2026-04-02 09:00:00+01');

INSERT INTO products (id, key, name, family, from_quantity, sides_choice) VALUES
  (1, 'business-cards', 'Business cards', 'card', 100, true),
  (2, 'folded-cards', 'Folded cards', 'card', 100, true),
  (3, 'flyers', 'Flyers & leaflets', 'paper', 250, true),
  (4, 'letterheads', 'Letterheads', 'paper', 250, true),
  (5, 'comp-slips', 'Compliment slips', 'paper', 250, true),
  (6, 'envelopes', 'Envelopes', 'mail', 250, false),
  (7, 'stickers', 'Stickers & labels', 'label', 100, false),
  (8, 'posters', 'Posters', 'paper', 50, false),
  (9, 'roll-up-banners', 'Roll-up banners', 'large', 1, false),
  (10, 'pvc-banners', 'PVC banners', 'large', 1, false),
  (11, 'canvas', 'Canvas prints', 'fabric', 1, false);

INSERT INTO materials (id, key, name, kind, gsm, sheet_cost, on_hand, reorder_at) VALUES
  (1, 'silk-350', '350gsm silk board', 'sheet', 350, 0.42, 260, 80),
  (2, 'uncoated-300', '300gsm uncoated board', 'sheet', 300, 0.38, 420, 100),
  (3, 'silk-170', '170gsm silk', 'sheet', 170, 0.14, 980, 200),
  (4, 'silk-130', '130gsm silk', 'sheet', 130, 0.11, 1240, 250),
  (5, 'silk-350-sra2', '350gsm silk board, SRA2', 'sheet', 350, 0.84, 120, 40),
  (6, 'pvc-510', '510gsm PVC banner', 'roll', 510, 28.00, 18, 25),
  (7, 'mesh-270', '270gsm mesh banner', 'roll', 270, 32.00, 46, 20),
  (8, 'canvas-380', '380gsm cotton canvas', 'roll', 380, 46.00, 32, 15),
  (9, 'vinyl', 'Self-adhesive vinyl', 'roll', NULL, 34.00, 58, 20);

INSERT INTO quotes (id, ref, customer_id, label, configuration, total, saved_on, created_at) VALUES
  (1, 'MP-4111', 6, 'Workshop cards, heavier board', '{"product":"business-cards","material":"silk-350","size":"business-card","sides":2,"finish":"soft-touch","quantity":500,"packaging":"boxed","printedProof":false,"express":false,"delivery":"band-2kg"}'::jsonb, 100.15, '2026-07-29', '2026-07-29 11:00:00+01'),
  (2, 'MP-4112', 3, NULL, '{"product":"roll-up-banners","material":"pvc-510","size":"custom","customWidthMm":850,"customHeightMm":2000,"sides":1,"finish":"hemmed","quantity":1,"packaging":"bundled","printedProof":false,"express":false,"delivery":"tube"}'::jsonb, 136.56, '2026-08-03', '2026-08-03 11:00:00+01');

INSERT INTO jobs (id, ref, customer_id, product_id, material_id, quantity, trim_width_mm, trim_height_mm, sides, finish_key, packaging_key, stage, promised_for, express, spoiled_sheets, total, created_at, updated_at) VALUES
  (1, 'MP-4113', 1, 1, 1, 500, 85, 55, 2, 'matt-lam', 'boxed', 'ordered', '2026-08-11', false, 0, 85.15, '2026-08-04 09:00:00+01', '2026-08-04 16:30:00+01'),
  (2, 'MP-4114', 3, 3, 3, 250, 105, 148, 2, 'none', 'bundled', 'ordered', '2026-08-12', false, 0, 71.58, '2026-08-04 09:00:00+01', '2026-08-04 16:30:00+01'),
  (3, 'MP-4115', 2, 4, 4, 1000, 210, 297, 1, 'none', 'boxed', 'proofed', '2026-08-10', false, 0, 366.48, '2026-08-04 09:00:00+01', '2026-08-04 16:30:00+01'),
  (4, 'MP-4116', 5, 2, 2, 250, 105, 148, 2, 'soft-touch', 'boxed', 'proofed', '2026-08-07', false, 0, 146.41, '2026-08-03 09:00:00+01', '2026-08-04 16:30:00+01'),
  (5, 'MP-4117', 4, 7, 9, 500, 105, 148, 1, 'gloss-lam', 'shrink-wrapped', 'proofed', '2026-08-06', true, 0, 3266.38, '2026-08-05 09:00:00+01', '2026-08-05 16:30:00+01'),
  (6, 'MP-4118', 7, 8, 3, 100, 297, 420, 1, 'matt-lam', 'bundled', 'printing', '2026-08-04', false, 4, 187.39, '2026-07-30 09:00:00+01', '2026-07-31 16:30:00+01'),
  (7, 'MP-4119', 6, 1, 2, 250, 85, 55, 2, 'none', 'bundled', 'printing', '2026-08-05', false, 0, 38.44, '2026-08-01 09:00:00+01', '2026-08-03 16:30:00+01'),
  (8, 'MP-4120', 2, 5, 4, 500, 210, 99, 1, 'none', 'bundled', 'printing', '2026-08-06', false, 0, 116.65, '2026-08-03 09:00:00+01', '2026-08-03 16:30:00+01'),
  (9, 'MP-4121', 3, 10, 6, 2, 900, 2000, 1, 'hemmed', 'bundled', 'printing', '2026-08-07', false, 0, 226.08, '2026-08-04 09:00:00+01', '2026-08-04 16:30:00+01'),
  (10, 'MP-4122', 5, 1, 1, 1000, 85, 55, 2, 'soft-touch', 'boxed', 'finishing', '2026-08-06', false, 6, 155.64, '2026-07-31 09:00:00+01', '2026-08-01 16:30:00+01'),
  (11, 'MP-4123', 1, 6, 2, 500, 220, 110, 1, 'none', 'boxed', 'finishing', '2026-08-06', false, 0, 189.68, '2026-08-01 09:00:00+01', '2026-08-03 16:30:00+01'),
  (12, 'MP-4124', 7, 11, 8, 3, 600, 900, 1, 'stretched', 'bundled', 'finishing', '2026-08-07', false, 0, 153.79, '2026-08-03 09:00:00+01', '2026-08-04 16:30:00+01'),
  (13, 'MP-4125', 4, 3, 4, 1000, 148, 210, 2, 'none', 'boxed', 'ready', '2026-08-05', false, 2, 260.34, '2026-07-30 09:00:00+01', '2026-07-31 16:30:00+01'),
  (14, 'MP-4126', 6, 1, 1, 500, 85, 55, 2, 'matt-lam', 'boxed', 'ready', '2026-08-05', false, 0, 85.15, '2026-07-31 09:00:00+01', '2026-08-01 16:30:00+01'),
  (15, 'MP-4104', 1, 1, 1, 250, 85, 55, 2, 'matt-lam', 'bundled', 'collected', '2026-06-18', false, 0, 52.55, '2026-06-15 09:00:00+01', '2026-06-18 16:30:00+01'),
  (16, 'MP-4098', 3, 3, 3, 500, 105, 148, 2, 'none', 'bundled', 'collected', '2026-05-22', false, 0, 110.75, '2026-05-19 09:00:00+01', '2026-05-22 16:30:00+01'),
  (17, 'MP-4107', 7, 8, 3, 50, 297, 420, 1, 'none', 'bundled', 'dispatched', '2026-07-02', false, 0, 76.25, '2026-06-29 09:00:00+01', '2026-07-02 16:30:00+01'),
  (18, 'MP-4110', 2, 5, 4, 250, 210, 99, 1, 'none', 'bundled', 'collected', '2026-07-24', false, 0, 75.31, '2026-07-21 09:00:00+01', '2026-07-24 16:30:00+01');

INSERT INTO artwork (id, job_id, filename, file, width_px, height_px, width_mm, height_mm, bleed_mm, nearest_ink_mm, colour_space, fonts_embedded, pages, source, created_at) VALUES
  (1, 1, 'harbour-cards-front.pdf', convert_to(e'%PDF-1.7\n%%EOF\n', 'UTF8'), 1075, 721, 91, 61, 3, 5.2, 'CMYK', true, 2, NULL, '2026-08-04 09:30:00+01'),
  (2, 3, 'fenwick-letterhead.pdf', convert_to(e'%PDF-1.7\n%%EOF\n', 'UTF8'), 2551, 3579, 216, 303, 3, 1.8, 'CMYK', true, 1, NULL, '2026-08-04 09:30:00+01'),
  (3, 6, 'gallery-autumn-poster.pdf', convert_to(e'%PDF-1.7\n%%EOF\n', 'UTF8'), 3579, 5031, 303, 426, 3, 8, 'CMYK', true, 1, NULL, '2026-07-30 09:30:00+01'),
  (4, 4, 'ostara-folded-card.pdf', convert_to(e'%PDF-1.7\n%%EOF\n', 'UTF8'), 1311, 1831, 111, 154, 3, 6.4, 'CMYK', true, 2, NULL, '2026-08-03 09:30:00+01');

INSERT INTO proofs (id, job_id, kind, note, at) VALUES
  (1, 3, 'sent', NULL, '2026-08-04'),
  (2, 4, 'sent', NULL, '2026-08-03'),
  (3, 4, 'change-asked', 'Move the address block down a shade — it sits too close to the fold.', '2026-08-04'),
  (4, 4, 'sent', NULL, '2026-08-04'),
  (5, 5, 'sent', NULL, '2026-08-05'),
  (6, 6, 'sent', NULL, '2026-07-30'),
  (7, 6, 'approved', NULL, '2026-07-31'),
  (8, 7, 'sent', NULL, '2026-08-01'),
  (9, 7, 'approved', NULL, '2026-08-03'),
  (10, 8, 'sent', NULL, '2026-08-03'),
  (11, 8, 'approved', NULL, '2026-08-03'),
  (12, 9, 'sent', NULL, '2026-08-04'),
  (13, 9, 'approved', NULL, '2026-08-04'),
  (14, 10, 'sent', NULL, '2026-07-31'),
  (15, 10, 'approved', NULL, '2026-08-01'),
  (16, 11, 'sent', NULL, '2026-08-01'),
  (17, 11, 'approved', NULL, '2026-08-03'),
  (18, 12, 'sent', NULL, '2026-08-03'),
  (19, 12, 'approved', NULL, '2026-08-04'),
  (20, 13, 'sent', NULL, '2026-07-30'),
  (21, 13, 'approved', NULL, '2026-07-31'),
  (22, 14, 'sent', NULL, '2026-07-31'),
  (23, 14, 'approved', NULL, '2026-08-01'),
  (24, 15, 'sent', NULL, '2026-06-15'),
  (25, 15, 'approved', NULL, '2026-06-15'),
  (26, 16, 'sent', NULL, '2026-05-19'),
  (27, 16, 'approved', NULL, '2026-05-20'),
  (28, 17, 'sent', NULL, '2026-06-29'),
  (29, 17, 'approved', NULL, '2026-06-29'),
  (30, 18, 'sent', NULL, '2026-07-21'),
  (31, 18, 'approved', NULL, '2026-07-21');

INSERT INTO dispatches (id, job_id, kind, tracking, at) VALUES
  (1, 15, 'collected', NULL, '2026-06-18 16:30:00+01'),
  (2, 16, 'collected', NULL, '2026-05-22 16:30:00+01'),
  (3, 17, 'collected', NULL, '2026-07-02 16:30:00+01'),
  (4, 18, 'collected', NULL, '2026-07-24 16:30:00+01');

INSERT INTO stock_movements (id, material_id, job_id, kind, sheets, at) VALUES
  (1, 3, 6, 'consumed', 100, '2026-07-31 08:30:00+01'),
  (2, 3, 6, 'spoilage', 4, '2026-07-31 14:00:00+01'),
  (3, 2, 7, 'consumed', 12, '2026-08-03 08:30:00+01'),
  (4, 4, 8, 'consumed', 125, '2026-08-03 08:30:00+01'),
  (5, 6, 9, 'consumed', 4, '2026-08-04 08:30:00+01'),
  (6, 1, 10, 'consumed', 48, '2026-08-01 08:30:00+01'),
  (7, 1, 10, 'spoilage', 6, '2026-08-01 14:00:00+01'),
  (8, 2, 11, 'consumed', 167, '2026-08-03 08:30:00+01'),
  (9, 8, 12, 'consumed', 3, '2026-08-04 08:30:00+01'),
  (10, 4, 13, 'consumed', 250, '2026-07-31 08:30:00+01'),
  (11, 4, 13, 'spoilage', 2, '2026-07-31 14:00:00+01'),
  (12, 1, 14, 'consumed', 24, '2026-08-01 08:30:00+01'),
  (13, 1, 15, 'consumed', 12, '2026-06-15 08:30:00+01'),
  (14, 3, 16, 'consumed', 84, '2026-05-20 08:30:00+01'),
  (15, 3, 17, 'consumed', 50, '2026-06-29 08:30:00+01'),
  (16, 4, 18, 'consumed', 63, '2026-07-21 08:30:00+01'),
  (17, 3, NULL, 'delivery', 500, '2026-07-28 07:45:00+01'),
  (18, 4, NULL, 'delivery', 1000, '2026-07-31 07:45:00+01'),
  (19, 1, NULL, 'delivery', 250, '2026-08-03 07:45:00+01');

DO $$
DECLARE
  seeded text;
BEGIN
  FOREACH seeded IN ARRAY ARRAY['customers', 'products', 'materials', 'quotes', 'jobs', 'artwork', 'proofs', 'dispatches', 'stock_movements'] LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, ''id''), (SELECT max(id) FROM %I))',
      seeded, seeded);
  END LOOP;
END $$;

COMMIT;
