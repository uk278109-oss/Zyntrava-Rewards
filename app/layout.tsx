import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ludo Party – Desi Dhamaka",
  description: "Offline modern Ludo game",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}