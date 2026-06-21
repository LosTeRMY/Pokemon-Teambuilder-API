CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('merged', 'pending');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "analysis_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" integer NOT NULL,
	"author_id" integer,
	"target_name" varchar(80) NOT NULL,
	"note" text NOT NULL,
	"item_id" integer,
	"ability_id" integer,
	"nature_id" integer,
	"evs" jsonb,
	"moves" jsonb,
	"analysis" text,
	"ev_note" text,
	"teambuilding" text,
	"matchup_note" text,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" integer NOT NULL,
	"set_id" integer,
	"author_id" integer,
	"is_ai" boolean DEFAULT false NOT NULL,
	"status" "revision_status" DEFAULT 'merged' NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"role" varchar(120),
	"item_id" integer,
	"ability_id" integer,
	"nature_id" integer,
	"evs" jsonb,
	"moves" jsonb NOT NULL,
	"analysis" text,
	"ev_note" text,
	"teambuilding" text,
	"matchup_note" text,
	"handles" jsonb DEFAULT '[]'::jsonb,
	"threats" jsonb DEFAULT '[]'::jsonb,
	"is_ai_draft" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokemon_id" integer NOT NULL,
	"role" varchar(120),
	"overview" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pokemon_analyses_pokemon_id_unique" UNIQUE("pokemon_id")
);
--> statement-breakpoint
CREATE TABLE "proposal_votes" (
	"proposal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "proposal_votes_proposal_id_user_id_pk" PRIMARY KEY("proposal_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis_proposals" ADD CONSTRAINT "analysis_proposals_analysis_id_pokemon_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."pokemon_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_proposals" ADD CONSTRAINT "analysis_proposals_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_revisions" ADD CONSTRAINT "analysis_revisions_analysis_id_pokemon_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."pokemon_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_revisions" ADD CONSTRAINT "analysis_revisions_set_id_analysis_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."analysis_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_revisions" ADD CONSTRAINT "analysis_revisions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_sets" ADD CONSTRAINT "analysis_sets_analysis_id_pokemon_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."pokemon_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_sets" ADD CONSTRAINT "analysis_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_sets" ADD CONSTRAINT "analysis_sets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_analyses" ADD CONSTRAINT "pokemon_analyses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_proposal_id_analysis_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."analysis_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;