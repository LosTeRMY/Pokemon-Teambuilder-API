-- Drop tables
DROP TABLE IF EXISTS team_likes CASCADE;
DROP TABLE IF EXISTS teams_pokemons_moves CASCADE;
DROP TABLE IF EXISTS teams_pokemons CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS gender CASCADE;

-- Enums
CREATE TYPE gender AS ENUM ('male', 'female', 'random', 'genderless');

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL,
  pseudo VARCHAR(60) NOT NULL UNIQUE,
  avatar VARCHAR(255),
  bio VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  format_id INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams pokemons
CREATE TABLE teams_pokemons (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL,
  ability_id INTEGER NOT NULL,
  nature_id INTEGER NOT NULL,
  item_id INTEGER,
  level INTEGER NOT NULL,
  gender gender NOT NULL,
  shiny BOOLEAN NOT NULL,
  happiness INTEGER NOT NULL DEFAULT 255,
  nickname VARCHAR(12),
  iv_hp INTEGER NOT NULL CHECK (iv_hp BETWEEN 0 AND 31),
  iv_attack INTEGER NOT NULL CHECK (iv_attack BETWEEN 0 AND 31),
  iv_defense INTEGER NOT NULL CHECK (iv_defense BETWEEN 0 AND 31),
  iv_sp_attack INTEGER NOT NULL CHECK (iv_sp_attack BETWEEN 0 AND 31),
  iv_sp_defense INTEGER NOT NULL CHECK (iv_sp_defense BETWEEN 0 AND 31),
  iv_speed INTEGER NOT NULL CHECK (iv_speed BETWEEN 0 AND 31),
  ev_hp INTEGER NOT NULL CHECK (ev_hp BETWEEN 0 AND 252),
  ev_attack INTEGER NOT NULL CHECK (ev_attack BETWEEN 0 AND 252),
  ev_defense INTEGER NOT NULL CHECK (ev_defense BETWEEN 0 AND 252),
  ev_sp_attack INTEGER NOT NULL CHECK (ev_sp_attack BETWEEN 0 AND 252),
  ev_sp_defense INTEGER NOT NULL CHECK (ev_sp_defense BETWEEN 0 AND 252),
  ev_speed INTEGER NOT NULL CHECK (ev_speed BETWEEN 0 AND 252),
  UNIQUE (team_id, pokemon_id)
);

-- Teams pokemons moves
CREATE TABLE teams_pokemons_moves (
  teams_pokemon_id INTEGER NOT NULL REFERENCES teams_pokemons(id) ON DELETE CASCADE,
  move_id INTEGER NOT NULL,
  PRIMARY KEY (teams_pokemon_id, move_id)
);

-- Team likes
CREATE TABLE team_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, team_id)
);

-- Indexes
CREATE INDEX ON teams_pokemons (pokemon_id);
CREATE INDEX ON teams_pokemons (ability_id);
CREATE INDEX ON teams_pokemons_moves (move_id);
CREATE INDEX ON team_likes (team_id);
