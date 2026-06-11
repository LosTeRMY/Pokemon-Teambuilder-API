"use client";

import { useState } from "react";
import type { Format } from "@/types";

const FORMAT_COLORS: Record<string, string> = {
  ubers: "border-purple-400 text-purple-700 bg-purple-50 data-[active=true]:bg-purple-600 data-[active=true]:text-white data-[active=true]:border-purple-600",
  ou:    "border-teal-400 text-teal-700 bg-teal-50 data-[active=true]:bg-teal-600 data-[active=true]:text-white data-[active=true]:border-teal-600",
  uu:    "border-orange-400 text-orange-700 bg-orange-50 data-[active=true]:bg-orange-600 data-[active=true]:text-white data-[active=true]:border-orange-600",
  nu:    "border-red-400 text-red-700 bg-red-50 data-[active=true]:bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600",
  pu:    "border-gray-400 text-gray-600 bg-gray-50 data-[active=true]:bg-gray-500 data-[active=true]:text-white data-[active=true]:border-gray-500",
  lc:    "border-green-400 text-green-700 bg-green-50 data-[active=true]:bg-green-600 data-[active=true]:text-white data-[active=true]:border-green-600",
};

type Props = {
  formats: Format[];
  formatCounts: Record<number, number>;
};

export default function FilterSidebar({ formats, formatCounts }: Props) {
  const [teamName, setTeamName] = useState("");
  const [activeFormat, setActiveFormat] = useState<number | null>(null);
  const [pokemon, setPokemon] = useState("");
  const [move, setMove] = useState("");
  const [ability, setAbility] = useState("");
  const [item, setItem] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [likedByMe, setLikedByMe] = useState(false);

  return (
    <aside className="w-150 shrink-0 flex flex-col gap-6 py-6 px-4">
      {/* Team name */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team name</label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
        />
      </div>

      {/* Format */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Format</label>
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => (
            <button
              key={f.id}
              data-active={activeFormat === f.id}
              onClick={() => setActiveFormat(activeFormat === f.id ? null : f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${FORMAT_COLORS[f.tier] ?? "border-gray-300 text-gray-600"}`}
            >
              {f.name} <span className="opacity-70">{formatCounts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contains */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contains</p>
          <p className="text-xs text-gray-400 mt-0.5">team must include all of these</p>
        </div>
        {[
          { label: "Pokémon", value: pokemon, set: setPokemon, placeholder: "Add a Pokémon..." },
          { label: "Move", value: move, set: setMove, placeholder: "Add a move..." },
          { label: "Ability", value: ability, set: setAbility, placeholder: "Add an ability..." },
          { label: "Item", value: item, set: setItem, placeholder: "Add an item..." },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            />
          </div>
        ))}
      </div>

      {/* Specific sets */}
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specific sets</p>
          <p className="text-xs text-gray-400 mt-0.5">pin a Pokémon to an exact move, item, ability or nature</p>
        </div>
        <button className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-left">
          Pin a Pokémon for exact conditions
        </button>
      </div>

      {/* Liked by me */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={likedByMe}
          onChange={(e) => setLikedByMe(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
        />
        <span className="text-sm text-gray-700">Liked by me</span>
      </label>
    </aside>
  );
}
