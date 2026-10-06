import type { Metadata } from "next"; import "./globals.css";
export const metadata:Metadata={title:"Ludo Party — Desi Dhamaka",description:"Modern offline and online-ready Ludo"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
