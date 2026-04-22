import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scriptoria — Écrivez votre roman, étape par étape",
  description:
    "Plateforme d'aide à l'écriture basée sur la méthode Snowflake. Structurez, planifiez et rédigez votre roman.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${geist.className} min-h-full bg-stone-950 text-stone-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
