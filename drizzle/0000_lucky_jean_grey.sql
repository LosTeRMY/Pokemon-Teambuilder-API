CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'random', 'genderless');--> statement-breakpoint
CREATE TABLE "team_likes" (
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT "team_likes_user_id_team_id_pk" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(30) NOT NULL,
	"description" text,
	"user_id" integer,
	"format_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams_pokemons" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"pokemon_id" integer NOT NULL,
	"ability_id" integer NOT NULL,
	"nature_id" integer NOT NULL,
	"item_id" integer,
	"level" integer NOT NULL,
	"gender" "gender" NOT NULL,
	"shiny" boolean DEFAULT false,
	"happiness" integer DEFAULT 255 NOT NULL,
	"nickname" varchar(12),
	"iv_hp" integer DEFAULT 31 NOT NULL,
	"iv_atk" integer DEFAULT 31 NOT NULL,
	"iv_def" integer DEFAULT 31 NOT NULL,
	"iv_sp_atk" integer DEFAULT 31 NOT NULL,
	"iv_sp_def" integer DEFAULT 31 NOT NULL,
	"iv_speed" integer DEFAULT 31 NOT NULL,
	"ev_hp" integer DEFAULT 0 NOT NULL,
	"ev_atk" integer DEFAULT 0 NOT NULL,
	"ev_def" integer DEFAULT 0 NOT NULL,
	"ev_sp_atk" integer DEFAULT 0 NOT NULL,
	"ev_sp_def" integer DEFAULT 0 NOT NULL,
	"ev_speed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams_pokemons_moves" (
	"teams_pokemon_id" integer NOT NULL,
	"move_id" integer NOT NULL,
	CONSTRAINT "teams_pokemons_moves_teams_pokemon_id_move_id_pk" PRIMARY KEY("teams_pokemon_id","move_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(60) NOT NULL,
	"password" varchar(60) NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar" varchar(255),
	"bio" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "team_likes" ADD CONSTRAINT "team_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_likes" ADD CONSTRAINT "team_likes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_pokemons" ADD CONSTRAINT "teams_pokemons_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_pokemons_moves" ADD CONSTRAINT "teams_pokemons_moves_teams_pokemon_id_teams_pokemons_id_fk" FOREIGN KEY ("teams_pokemon_id") REFERENCES "public"."teams_pokemons"("id") ON DELETE cascade ON UPDATE no action;