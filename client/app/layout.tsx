import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokéBuild — Gen 4 Teambuilder",
  description:
    "Build and share competitive Gen 4 Pokémon teams with the community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* set the theme before first paint to avoid a light->dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          try {
            var s = localStorage.getItem('pb-theme');
            if (s === 'light' || s === 'dark') document.documentElement.setAttribute('data-theme', s);
            else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
              document.documentElement.setAttribute('data-theme', 'dark');
          } catch(e) {}
        `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
