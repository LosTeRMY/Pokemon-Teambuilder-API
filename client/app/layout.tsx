import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./providers";
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
      <head />
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
