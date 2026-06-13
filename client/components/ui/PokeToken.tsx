"use client";

import { useState, useEffect, useRef } from "react";
import * as LK from "@/lib/lookups";
import { spriteUrl } from "@/lib/mockData";
import { tc } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

/* ---- Sprite token (gradient placeholder + real sprite layered on top) ---- */
export function SpriteTile({
  slug,
  name,
  types,
  size,
  round,
}: {
  slug: string;
  name: string;
  types: string[];
  size: number;
  round?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  const grad =
    types.length > 1
      ? `linear-gradient(135deg, ${tc(types[0])} 0%, ${tc(types[0])} 48%, ${tc(types[1])} 52%, ${tc(types[1])} 100%)`
      : tc(types[0]);
  return (
    <div
      className={cn(
        "relative rounded-[7px] overflow-hidden",
        round && "spr--round rounded-full",
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      <div
        className="absolute inset-0 grid place-items-center text-center leading-[1.05] p-0.75 text-white font-extrabold tracking-[-0.01em] [text-shadow:0_1px_2px_rgba(0,0,0,0.32)] wrap-break-word"
        style={{
          background: grad,
          fontSize: Math.max(7, Math.round(size * 0.17)),
        }}
      >
        {size >= 36 && <span>{name}</span>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        className="spr-img"
        src={spriteUrl(slug)}
        alt={name}
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export function PokeToken({ pid, size }: { pid: number; size: number }) {
  const p = LK.pokeById.get(pid);
  if (!p)
    return (
      <div
        className="relative rounded-[7px] overflow-hidden"
        style={{ width: size, height: size, background: "#cdd3dc" }}
      />
    );
  return (
    <SpriteTile
      slug={LK.slug(p.name)}
      name={p.name}
      types={p.types}
      size={size}
      round
    />
  );
}
