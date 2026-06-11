import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PokéBuild — Gen 4 Teambuilder",
  description: "Build and share competitive Gen 4 Pokémon teams with the community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var s = localStorage.getItem('pb-theme');
            if (s === 'light' || s === 'dark') document.documentElement.setAttribute('data-theme', s);
            else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
              document.documentElement.setAttribute('data-theme', 'dark');
          } catch(e) {}
        ` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
