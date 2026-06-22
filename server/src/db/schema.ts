import { pgTable, serial, varchar, timestamp, text, integer, boolean, pgEnum, primaryKey, jsonb, unique } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'random', 'genderless']);
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    avatar: varchar('avatar', { length: 255 }),
    bio: varchar('bio', { length: 255 }),
    role: userRoleEnum('role').notNull().default('user'),
    // Embedded in every JWT at sign-time and checked on every authenticated
    // request (middleware/auth.ts) — bumping this invalidates every
    // previously issued token at once, since JWTs are otherwise stateless
    // and can't be revoked any other way before they expire.
    tokenVersion: integer('token_version').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

export  const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 30 }).notNull(),
    description: text('description'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    format_id: integer('format_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});


export const teams_pokemons = pgTable('teams_pokemons', {
    id: serial('id').primaryKey(),
    team_id: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
    pokemon_id: integer('pokemon_id').notNull(),
    ability_id: integer('ability_id').notNull(),
    nature_id: integer('nature_id').notNull(),
    item_id: integer('item_id'),
    level: integer('level').notNull(),
    gender: genderEnum('gender').notNull(), 
    shiny: boolean('shiny').default(false),
    happiness: integer('happiness').default(255).notNull(),
    nickname: varchar('nickname', { length: 12 }),
    iv_hp: integer('iv_hp').default(31).notNull(),
    iv_atk: integer('iv_atk').default(31).notNull(),
    iv_def: integer('iv_def').default(31).notNull(),
    iv_sp_atk: integer('iv_sp_atk').default(31).notNull(),
    iv_sp_def: integer('iv_sp_def').default(31).notNull(),
    iv_speed: integer('iv_speed').default(31).notNull(),
    ev_hp: integer('ev_hp').default(0).notNull(),
    ev_atk: integer('ev_atk').default(0).notNull(),
    ev_def: integer('ev_def').default(0).notNull(),
    ev_sp_atk: integer('ev_sp_atk').default(0).notNull(),
    ev_sp_def: integer('ev_sp_def').default(0).notNull(),
    ev_speed: integer('ev_speed').default(0).notNull(),
    notes: text('notes'),
    roles: text('roles').array(),
});

export const team_likes = pgTable('team_likes', {
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    team_id: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.user_id, table.team_id] }),
]);

export const teams_pokemons_moves = pgTable('teams_pokemons_moves', {
    teams_pokemon_id: integer('teams_pokemon_id').references(() => teams_pokemons.id, { onDelete: 'cascade' }).notNull(),
    move_id: integer('move_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.teams_pokemon_id, table.move_id] }),
]);

export const revisionStatusEnum = pgEnum('revision_status', ['merged', 'pending']);
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected']);

/* One row per Pokémon (by the static game-data id in data/pokemons.json — not
 * a DB FK, same convention as teams_pokemons.pokemon_id) that has any
 * community-contributed analysis. Created on first contribution. */
export const pokemonAnalyses = pgTable('pokemon_analyses', {
    id: serial('id').primaryKey(),
    pokemonId: integer('pokemon_id').notNull().unique(),
    role: varchar('role', { length: 120 }),
    overview: text('overview'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* A competitive moveset attached to an analysis. updatedBy/updatedAt are the
 * "last edit by" pointer shown in the UI; analysisRevisions below is the full
 * append-only history. */
export const analysisSets = pgTable('analysis_sets', {
    id: serial('id').primaryKey(),
    analysisId: integer('analysis_id').references(() => pokemonAnalyses.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    role: varchar('role', { length: 120 }),
    itemId: integer('item_id'),
    abilityId: integer('ability_id'),
    natureId: integer('nature_id'),
    evs: varchar('evs', { length: 60 }), // formatted display string, e.g. "4 HP / 252 Atk / 252 Spe" — matches AnalysisSet.evs in client/app/pokedex/[slug]/data.ts
    moves: jsonb('moves').$type<string[]>().notNull(),
    analysis: text('analysis'),
    evNote: text('ev_note'),
    teambuilding: text('teambuilding'),
    matchupNote: text('matchup_note'),
    handles: jsonb('handles').$type<number[]>().default([]),
    threats: jsonb('threats').$type<number[]>().default([]),
    isAiDraft: boolean('is_ai_draft').notNull().default(false),
    orderIndex: integer('order_index').notNull().default(0),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // Guards against two concurrent "add a set" requests silently landing on
  // the same display position — see createSet()'s transaction in analysisService.ts.
  unique().on(table.analysisId, table.orderIndex),
]);

/* Append-only audit log — the source of truth for both the Activity Timeline
 * and the live-computed Contributors strip (role = Creator/Editor/AI draft,
 * derived from these rows; no stored contributor table or edit counters). */
export const analysisRevisions = pgTable('analysis_revisions', {
    id: serial('id').primaryKey(),
    analysisId: integer('analysis_id').references(() => pokemonAnalyses.id, { onDelete: 'cascade' }).notNull(),
    setId: integer('set_id').references(() => analysisSets.id, { onDelete: 'set null' }),
    authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
    isAi: boolean('is_ai').notNull().default(false),
    status: revisionStatusEnum('status').notNull().default('merged'),
    summary: text('summary').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* A pending "suggest a set" submission. Promotion into a real analysisSets
 * row (and a matching analysisRevisions entry) is moderator/admin-gated. */
export const analysisProposals = pgTable('analysis_proposals', {
    id: serial('id').primaryKey(),
    analysisId: integer('analysis_id').references(() => pokemonAnalyses.id, { onDelete: 'cascade' }).notNull(),
    authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
    targetName: varchar('target_name', { length: 80 }).notNull(),
    note: text('note').notNull(),
    itemId: integer('item_id'),
    abilityId: integer('ability_id'),
    natureId: integer('nature_id'),
    evs: varchar('evs', { length: 60 }),
    moves: jsonb('moves').$type<string[]>(),
    analysis: text('analysis'),
    evNote: text('ev_note'),
    teambuilding: text('teambuilding'),
    matchupNote: text('matchup_note'),
    status: proposalStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const proposalVotes = pgTable('proposal_votes', {
    proposal_id: integer('proposal_id').references(() => analysisProposals.id, { onDelete: 'cascade' }).notNull(),
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.proposal_id, table.user_id] }),
]);
