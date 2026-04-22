import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/ThemeProvider'
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scriptoria — Write your novel, step by step",
  description:
    "Writing assistance platform based on the Snowflake Method. Structure, plan and write your novel.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="h-full">
      <body className={`${geist.className} min-h-full bg-stone-950 text-stone-100 antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
