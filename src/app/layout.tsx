import type { Metadata } from "next";
import {
  Slackey,
  Press_Start_2P,
  Bricolage_Grotesque,
  Titan_One,
} from "next/font/google";
import "./globals.css";

const displayFont = Titan_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const slackeyFont = Slackey({
  variable: "--font-slackey",
  weight: "400",
  subsets: ["latin"],
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Bricolage_Grotesque({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dexter",
  description: "A mobile-first wildlife binder for playful species collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${slackeyFont.variable} ${pixelFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        {children}
      </body>
    </html>
  );
}
