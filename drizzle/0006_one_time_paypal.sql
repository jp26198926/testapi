ALTER TABLE "plans" ADD COLUMN "amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "duration_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "paypal_plan_id";--> statement-breakpoint
UPDATE "plans" SET "amount" = 9.00, "currency" = 'USD', "duration_days" = 30, "price" = '$9 / 30 days' WHERE lower("name") = 'pro';
