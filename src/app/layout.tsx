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

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} antialiased`} suppressHydrationWarning>
      <body className={`${openSans.className} min-h-full flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
