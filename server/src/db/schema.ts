import { pgTable, serial, varchar, timestamp, text, integer, boolean, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'random', 'genderless']);

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    avatar: varchar('avatar', { length: 255 }),
    bio: varchar('bio', { length: 255 }),
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
