import type { Metadata } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import "./globals.css";

const caveat = Caveat({ subsets: ["latin"] });
const patrickHand = Patrick_Hand({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-patrick-hand'
});

export const metadata: Metadata = {
  title: "AI Notebook Chat",
  description: "A notebook-style chat interface powered by OpenAI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${patrickHand.variable} ${caveat.className}`}>{children}</body>
    </html>
  );
}
