-- Migrate collections.id and records.id from uuid to integer identity
-- and records.collection_id from uuid to integer.
-- Also captures pending plans column changes detected by drizzle-kit.
--
-- Strategy: use plain integer columns first (so we can UPDATE them),
-- then convert to GENERATED ALWAYS AS IDENTITY at the end.

-- ── Plans (pending from previous schema edits) ───────────────────────────────

ALTER TABLE "plans" ALTER COLUMN "amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint

-- ── Step 1: Add new plain integer columns (not identity yet) ─────────────────

ALTER TABLE "collections" ADD COLUMN "id_new" integer;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "id_new" integer;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "collection_id_new" integer;--> statement-breakpoint

-- ── Step 2: Populate collections.id_new (sequential by created_at) ──────────

WITH "ordered" AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC, "id" ASC) AS "rn"
  FROM "collections"
)
UPDATE "collections" c
SET "id_new" = o."rn"
FROM "ordered" o
WHERE c."id" = o."id";--> statement-breakpoint

-- ── Step 3: Populate records.id_new (sequential by created_at) ──────────────

WITH "ordered" AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC, "id" ASC) AS "rn"
  FROM "records"
)
UPDATE "records" r
SET "id_new" = o."rn"
FROM "ordered" o
WHERE r."id" = o."id";--> statement-breakpoint

-- ── Step 4: Remap records.collection_id_new via collections mapping ─────────

UPDATE "records" r
SET "collection_id_new" = c."id_new"
FROM "collections" c
WHERE r."collection_id" = c."id";--> statement-breakpoint

-- ── Step 5: Drop old constraints (must drop FK before dropping columns) ─────

ALTER TABLE "records" DROP CONSTRAINT "records_collection_id_collections_id_fk";--> statement-breakpoint
ALTER TABLE "collections" DROP CONSTRAINT "collections_pkey";--> statement-breakpoint
ALTER TABLE "records" DROP CONSTRAINT "records_pkey";--> statement-breakpoint

-- ── Step 6: Drop old uuid columns (indexes on them auto-drop) ───────────────

ALTER TABLE "collections" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "collection_id";--> statement-breakpoint

-- ── Step 7: Rename new columns ───────────────────────────────────────────────

ALTER TABLE "collections" RENAME COLUMN "id_new" TO "id";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "id_new" TO "id";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "collection_id_new" TO "collection_id";--> statement-breakpoint

-- ── Step 8: Set NOT NULL constraints ─────────────────────────────────────────

ALTER TABLE "collections" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "collection_id" SET NOT NULL;--> statement-breakpoint

-- ── Step 9: Re-add primary keys ──────────────────────────────────────────────

ALTER TABLE "collections" ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_pkey" PRIMARY KEY ("id");--> statement-breakpoint

-- ── Step 10: Re-add foreign key ──────────────────────────────────────────────

ALTER TABLE "records" ADD CONSTRAINT "records_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- ── Step 11: Recreate the collection_id index (dropped with old column) ─────

CREATE INDEX "records_collection_id_idx" ON "records" USING btree ("collection_id");--> statement-breakpoint

-- ── Step 12: Convert plain integer columns to identity columns ───────────────

ALTER TABLE "collections" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "collections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint

-- ── Step 13: Sync identity sequences past current max values ─────────────────

SELECT setval(
  pg_get_serial_sequence('collections', 'id'),
  COALESCE((SELECT MAX("id") FROM "collections"), 0), true
);--> statement-breakpoint
SELECT setval(
  pg_get_serial_sequence('records', 'id'),
  COALESCE((SELECT MAX("id") FROM "records"), 0), true
);
