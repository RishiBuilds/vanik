import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Vanik — Independent shops, one checkout", template: "%s · Vanik" },
  description:
    "Vanik is a marketplace for independent Indian makers and small brands. Discover handmade ceramics, khadi, Ayurvedic skincare, estate coffee and more — pay by UPI, card or COD, and check out once.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff6e5" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1a17" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('vanik-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${dmSans.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-inverse"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
