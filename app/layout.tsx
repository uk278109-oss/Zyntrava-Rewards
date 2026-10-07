import "./globals.css";

export const metadata = {
  title: "Ludo Party – Desi Dhamaka",
  description: "Futuristic offline Ludo Party game",
  manifest: "/manifest.webmanifest"
};

export const viewport = {
  themeColor: "#07112d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
