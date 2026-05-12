import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BelaBlaze — BannerBlaze DOOH Platform",
    template: "%s | BelaBlaze",
  },
  description: "Plataforma administrativa para gestión de campañas publicitarias DOOH en tiempo real.",
  keywords: ["DOOH", "publicidad digital", "pantallas LED", "BannerBlaze", "BelaBlaze"],
  authors: [{ name: "BannerBlaze" }],
};

export const viewport = {
  themeColor: "#B8EB23",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <body className="bg-[#0A0A0A] text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
