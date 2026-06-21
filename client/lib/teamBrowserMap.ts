/* teamBrowserMap.ts — converts a GET /teams row (server's ID-based shape)
 * into the BrowserTeam/BrowserMember display shape TeamCard/MonSlot already
 * render, using the same GAMEDATA lookups as the rest of the client. */
import * as LK from "./lookups";
import type { BrowserTeam, BrowserMember } from "./lookups";

export type ServerPokemon = {
  pokemon_id: number;
  ability_id: number;
  item_id: number | null;
  nature_id: number;
  moves: number[];
};

export type ServerTeam = {
  id: number;
  name: string;
  description: string | null;
  userId: number | null;
  username: string | null;
  format_id: number;
  createdAt: string;
  // node-postgres returns COUNT() aggregates as a string (bigint-safe), not a number
  likes_count: number | string;
  liked: boolean | null;
  pokemons: ServerPokemon[];
};

function mapMember(p: ServerPokemon): BrowserMember {
  const mon = LK.pokeById.get(p.pokemon_id);
  const ability = LK.abilById.get(p.ability_id);
  const item = p.item_id != null ? LK.itemById.get(p.item_id) : null;
  const nature = LK.natById.get(p.nature_id);

  return {
    n: mon?.name ?? "",
    s: mon ? LK.slug(mon.name) : "",
    t: mon?.types ?? [],
    item: item?.name ?? "",
    abil: ability?.name ?? "",
    nat: nature?.name ?? "",
    moves: p.moves.map((id) => LK.moveById.get(id)?.name ?? "").filter(Boolean),
    pid: p.pokemon_id,
    moveIds: p.moves,
    abilId: p.ability_id,
    itemId: p.item_id,
    natId: p.nature_id,
  };
}

export function mapServerTeam(row: ServerTeam): BrowserTeam {
  return {
    id: row.id,
    name: row.name,
    format: row.format_id,
    author: { id: row.userId ?? 0, name: row.username ?? "Deleted user" },
    createdAt: row.createdAt,
    likes: Number(row.likes_count),
    liked: row.liked ?? false,
    description: row.description ?? "",
    members: row.pokemons.map(mapMember),
  };
}
