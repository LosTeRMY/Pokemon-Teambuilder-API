"use client";

import { useState, useEffect, useRef } from "react";
import * as LK from "@/lib/lookups";
import { itemSpriteUrl } from "@/lib/mockData";
import { avatarColor } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

/* Single source of truth for the colored-letter-square treatment — shown
 * while an icon loads, and permanently for items with no id or a 404'd icon
 * (a handful of names don't resolve to a Showdown spritenum). */
export function ItemFallback({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span
      className="rounded-[7px] grid place-items-center text-[11px] font-extrabold text-white shrink-0"
      style={{ width: size, height: size, background: avatarColor(name) }}
    >
      {name[0]?.toUpperCase() ?? ""}
    </span>
  );
}

/* Public wrapper just picks a key off itemId — remounting Inner on every item
 * change resets its loaded/errored state for free, instead of needing an
 * effect to do it (https://react.dev/learn/you-might-not-need-an-effect). */
export function ItemIcon({ itemId, size = 26 }: { itemId: number | null; size?: number }) {
  return <ItemIconInner key={itemId ?? "none"} itemId={itemId} size={size} />;
}

function ItemIconInner({ itemId, size }: { itemId: number | null; size: number }) {
  const item = itemId != null ? LK.itemById.get(itemId) : null;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  if (!item) return <ItemFallback name=" " size={size} />;

  const showFallback = !loaded || errored;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={item.name}>
      <div className={cn("absolute inset-0 transition-opacity duration-150", showFallback ? "opacity-100" : "opacity-0")}>
        <ItemFallback name={item.name} size={size} />
      </div>
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={itemSpriteUrl(LK.slug(item.name))}
          alt={item.name}
          width={size}
          height={size}
          className={cn("absolute inset-0 object-contain transition-opacity duration-150", loaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
