import Link from "next/link";

export default function Navbar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-6 sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polygon points="11,2 20,18 2,18" fill="#3b82f6" />
        </svg>
        <span className="font-bold text-gray-900 text-lg leading-none">PokéBuild</span>
        <span className="text-xs text-gray-400 font-medium tracking-wide">GEN 4 · DPP</span>
      </Link>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1">
        <Link
          href="/"
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white"
        >
          Teams
        </Link>
        <Link
          href="/pokedex"
          className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Pokédex
        </Link>
        <Link
          href="/builder"
          className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Builder
        </Link>
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <button
          aria-label="Toggle dark mode"
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <Link
          href="/teams/new"
          className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
        >
          + New team
        </Link>
        {/* User avatar — placeholder */}
        <button className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">
          A
        </button>
      </div>
    </header>
  );
}
