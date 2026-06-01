-- Drop tables
<<<<<<< HEAD
DROP TABLE IF EXISTS team_likes CASCADE;
DROP TABLE IF EXISTS teams_pokemons_moves CASCADE;
DROP TABLE IF EXISTS teams_pokemons CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
=======
DROP TABLE IF EXISTS teams_pokemons_moves CASCADE;
DROP TABLE IF EXISTS teams_pokemons CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS pokemon_moves CASCADE;
DROP TABLE IF EXISTS pokemon_abilities CASCADE;
DROP TABLE IF EXISTS move_generations CASCADE;
DROP TABLE IF EXISTS pokemon_tiers CASCADE;
DROP TABLE IF EXISTS pokemons CASCADE;
DROP TABLE IF EXISTS moves CASCADE;
DROP TABLE IF EXISTS abilities CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS natures CASCADE;
DROP TABLE IF EXISTS formats CASCADE;
>>>>>>> a2439fd307d09503dede3055120a2b03078a185e
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS gender CASCADE;
<<<<<<< HEAD

-- Enums
CREATE TYPE gender AS ENUM ('male', 'female', 'random', 'genderless');
=======
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS move_category CASCADE;
DROP TYPE IF EXISTS pokemon_type CASCADE;
DROP TYPE IF EXISTS stat CASCADE;
DROP TYPE IF EXISTS tier CASCADE;

-- Enums
CREATE TYPE gender AS ENUM ('male', 'female', 'random', 'genderless');
CREATE TYPE gender_type AS ENUM ('male_only', 'female_only', 'both', 'genderless');
CREATE TYPE move_category AS ENUM ('physical', 'special', 'status');
CREATE TYPE pokemon_type AS ENUM (
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
);
CREATE TYPE stat AS ENUM ('attack', 'defense', 'sp_attack', 'sp_defense', 'speed');
CREATE TYPE tier AS ENUM ('ubers', 'ou', 'uu', 'nu', 'pu', 'lc');
>>>>>>> a2439fd307d09503dede3055120a2b03078a185e

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL,
  pseudo VARCHAR(60) NOT NULL UNIQUE,
<<<<<<< HEAD
  avatar VARCHAR(255),
  bio VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

=======
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formats
CREATE TABLE formats (
  id SERIAL PRIMARY KEY,
  tier tier NOT NULL
);

-- Pokemons
CREATE TABLE pokemons (
  id SERIAL PRIMARY KEY,
  pokedex_number INTEGER NOT NULL,
  name VARCHAR(20) NOT NULL,
  type_1 pokemon_type NOT NULL,
  type_2 pokemon_type,
  hp INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  sp_attack INTEGER NOT NULL,
  sp_defense INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  gender_type gender_type NOT NULL,
  tier tier NOT NULL
);

-- Abilities
CREATE TABLE abilities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  description TEXT
);

-- Moves
CREATE TABLE moves (
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) NOT NULL,
  type pokemon_type NOT NULL,
  contact BOOLEAN NOT NULL,
  category move_category NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  power INTEGER,
  accuracy INTEGER,
  pp INTEGER NOT NULL,
  description TEXT
);

-- Natures
CREATE TABLE natures (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  boosted_stat stat,
  reduced_stat stat
);

-- Items
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) NOT NULL,
  description TEXT
);

-- Pokemon abilities
CREATE TABLE pokemon_abilities (
  pokemon_id INTEGER NOT NULL REFERENCES pokemons(id),
  ability_id INTEGER NOT NULL REFERENCES abilities(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (pokemon_id, ability_id)
);

-- Pokemon moves (learnset)
CREATE TABLE pokemon_moves (
  pokemon_id INTEGER NOT NULL REFERENCES pokemons(id),
  move_id INTEGER NOT NULL REFERENCES moves(id),
  PRIMARY KEY (pokemon_id, move_id)
);

>>>>>>> a2439fd307d09503dede3055120a2b03078a185e
-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
<<<<<<< HEAD
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  format_id INTEGER NOT NULL,
=======
  user_id INTEGER NOT NULL REFERENCES users(id),
  format_id INTEGER NOT NULL REFERENCES formats(id),
>>>>>>> a2439fd307d09503dede3055120a2b03078a185e
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams pokemons
CREATE TABLE teams_pokemons (
  id SERIAL PRIMARY KEY,
<<<<<<< HEAD
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL,
  ability_id INTEGER NOT NULL,
  nature_id INTEGER NOT NULL,
  item_id INTEGER,
  level INTEGER NOT NULL,
  gender gender NOT NULL,
  shiny BOOLEAN NOT NULL,
  happiness INTEGER NOT NULL DEFAULT 255,
=======
  team_id INTEGER NOT NULL REFERENCES teams(id),
  pokemon_id INTEGER NOT NULL REFERENCES pokemons(id),
  ability_id INTEGER NOT NULL REFERENCES abilities(id),
  nature_id INTEGER NOT NULL REFERENCES natures(id),
  item_id INTEGER REFERENCES items(id),
  level INTEGER NOT NULL,
  gender gender NOT NULL,
  shiny BOOLEAN NOT NULL,
  happiness INTEGER NOT NULL,
>>>>>>> a2439fd307d09503dede3055120a2b03078a185e
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
<<<<<<< HEAD
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
=======
  teams_pokemon_id INTEGER NOT NULL REFERENCES teams_pokemons(id),
  move_id INTEGER NOT NULL REFERENCES moves(id),
  PRIMARY KEY (teams_pokemon_id, move_id)
);
>>>>>>> a2439fd307d09503dede3055120a2b03078a185e
