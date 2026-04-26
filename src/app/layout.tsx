import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const openSans = localFont({
  src: "../fonts/OpenSans.ttf",
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "IA Schedule V2",
  description: "Schedule Management with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} antialiased`}>
      <body className={`${openSans.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
