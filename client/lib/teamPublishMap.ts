/* teamPublishMap.ts — translates between the builder's DraftTeam/DraftMember
 * shape and the server's createTeamSchema payload / teamService response
 * shapes: gender enum (M/F/N vs male/female/random/genderless) and EV/IV key
 * names (spa/spd/spe vs sp_atk/sp_def/speed) differ on each side. */
import * as LK from "./lookups";
import {
  type DraftTeam, type DraftMember, type StatSpread, type Gender,
  blankEvs, fullIvs, DEFAULT_HAPPINESS, DEFAULT_LEVEL, genderOptions,
} from "./teamBuilder";

type ServerGender = "male" | "female" | "random" | "genderless";

function genderToServer(g: Gender): ServerGender {
  return g === "M" ? "male" : g === "F" ? "female" : "genderless";
}
// "random" is a DB-only enum value this client never produces itself; fall
// back to "N" rather than crash if a row somehow has it.
function genderFromServer(g: ServerGender): Gender {
  return g === "male" ? "M" : g === "female" ? "F" : "N";
}

type ServerStats = { hp: number; atk: number; def: number; sp_atk: number; sp_def: number; speed: number };

function statsToServer(s: StatSpread): ServerStats {
  return { hp: s.hp, atk: s.atk, def: s.def, sp_atk: s.spa, sp_def: s.spd, speed: s.spe };
}
function statsFromServer(s: ServerStats): StatSpread {
  return { hp: s.hp, atk: s.atk, def: s.def, spa: s.sp_atk, spd: s.sp_def, spe: s.speed };
}

/* ---- forward: DraftTeam -> POST/PUT /teams payload ---- */

export function toCreateTeamPayload(team: DraftTeam) {
  return {
    name: team.name,
    formatId: team.formatId,
    description: team.strategy || undefined,
    pokemons: team.members
      .filter((m): m is DraftMember => m != null)
      .map((m) => ({
        pokemonId: m.pid,
        abilityId: m.abilityId,
        natureId: m.natureId,
        itemId: m.itemId ?? undefined,
        nickname: m.nickname || undefined,
        gender: genderToServer(m.gender),
        shiny: m.shiny,
        happiness: m.happiness,
        moves: m.moveIds.filter((id): id is number => id != null),
        ivs: statsToServer(m.ivs),
        evs: statsToServer(m.evs),
        notes: { roles: m.notes.roles, text: m.notes.text },
      })),
  };
}

/* ---- reverse: full GET /teams/:id detail -> editable DraftTeam ---- */

export type ServerPokemonDetail = {
  pokemon_id: number;
  ability_id: number;
  item_id: number | null;
  nature_id: number;
  level: number;
  gender: ServerGender;
  shiny: boolean | null;
  happiness: number;
  nickname: string | null;
  iv_hp: number; iv_atk: number; iv_def: number; iv_sp_atk: number; iv_sp_def: number; iv_speed: number;
  ev_hp: number; ev_atk: number; ev_def: number; ev_sp_atk: number; ev_sp_def: number; ev_speed: number;
  moves: number[];
  notes: { roles: string[]; text: string };
};

export type ServerTeamDetail = {
  id: number;
  name: string;
  description: string | null;
  format_id: number;
  pokemons: ServerPokemonDetail[];
};

function detailMemberToDraft(p: ServerPokemonDetail): DraftMember {
  return {
    uid: `m${p.pokemon_id}${Math.random().toString(36).slice(2, 7)}`,
    pid: p.pokemon_id,
    nickname: p.nickname ?? "",
    gender: genderFromServer(p.gender),
    shiny: !!p.shiny,
    itemId: p.item_id,
    abilityId: p.ability_id,
    natureId: p.nature_id,
    moveIds: [...p.moves, null, null, null, null].slice(0, 4),
    evs: statsFromServer({ hp: p.ev_hp, atk: p.ev_atk, def: p.ev_def, sp_atk: p.ev_sp_atk, sp_def: p.ev_sp_def, speed: p.ev_speed }),
    ivs: statsFromServer({ hp: p.iv_hp, atk: p.iv_atk, def: p.iv_def, sp_atk: p.iv_sp_atk, sp_def: p.iv_sp_def, speed: p.iv_speed }),
    happiness: p.happiness,
    level: p.level,
    notes: { roles: p.notes.roles, text: p.notes.text },
  };
}

export function fromTeamDetail(detail: ServerTeamDetail): DraftTeam {
  const members = detail.pokemons.map(detailMemberToDraft);
  return {
    id: `s${detail.id}`,
    serverId: detail.id,
    name: detail.name,
    formatId: detail.format_id,
    published: true,
    strategy: detail.description ?? "",
    members: [...members, null, null, null, null, null, null].slice(0, 6),
  };
}

/* ---- reverse: lean GET /teams?user=<id> row -> sidebar-card-only DraftTeam ----
 * Missing per-member fields (nickname/gender/shiny/ivs/evs/notes) take sensible
 * defaults — TeamListCard only reads pid/name/formatId/published. Opening this
 * team for real editing replaces it with fromTeamDetail()'s output. */

export type ServerPokemonSummary = {
  pokemon_id: number;
  ability_id: number;
  item_id: number | null;
  nature_id: number;
  moves: number[];
};

export type ServerTeamSummary = {
  id: number;
  name: string;
  description: string | null;
  format_id: number;
  pokemons: ServerPokemonSummary[];
};

function summaryMemberToDraft(p: ServerPokemonSummary): DraftMember {
  const mon = LK.pokeById.get(p.pokemon_id);
  return {
    uid: `m${p.pokemon_id}${Math.random().toString(36).slice(2, 7)}`,
    pid: p.pokemon_id,
    nickname: "",
    gender: mon ? genderOptions(mon.genderType)[0] : "N",
    shiny: false,
    itemId: p.item_id,
    abilityId: p.ability_id,
    natureId: p.nature_id,
    moveIds: [...p.moves, null, null, null, null].slice(0, 4),
    evs: blankEvs(),
    ivs: fullIvs(),
    happiness: DEFAULT_HAPPINESS,
    level: DEFAULT_LEVEL,
    notes: { roles: [], text: "" },
  };
}

export function fromTeamSummary(row: ServerTeamSummary): DraftTeam {
  const members = row.pokemons.map(summaryMemberToDraft);
  return {
    id: `s${row.id}`,
    serverId: row.id,
    name: row.name,
    formatId: row.format_id,
    published: true,
    strategy: row.description ?? "",
    members: [...members, null, null, null, null, null, null].slice(0, 6),
  };
}
