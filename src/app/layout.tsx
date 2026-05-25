import type { Metadata, Viewport } from "next";
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

const siteName = "BelaBlaze";
const description = "Plataforma DOOH enterprise para gestión de campañas publicitarias en tiempo real — by BannerBlaze.";

export const metadata: Metadata = {
  title: {
    default: `${siteName} — BannerBlaze DOOH Platform`,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    "DOOH", "publicidad digital", "pantallas LED", "BannerBlaze", "BelaBlaze",
    "marketing programático", "out of home", "ads platform", "DOOH SaaS",
  ],
  authors: [{ name: "BannerBlaze" }],
  creator: "BannerBlaze",
  publisher: "BannerBlaze",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName,
    title: `${siteName} — DOOH Platform`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — DOOH Platform`,
    description,
    creator: "@bannerblaze",
  },
  robots: {
    index: false, // private SaaS
    follow: false,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem('belablaze-compact')==='true')document.body.classList.add('compact')}catch(e){}`
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
