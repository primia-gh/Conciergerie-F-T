import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContextProvider } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  // L'italique sert aux mots mis en valeur des titres F&T (maquette « Lin & forêt »).
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Conciergerie Premium",
    template: "%s — Conciergerie Premium",
  },
  description:
    "Conciergerie privée : décrivez votre besoin, un concierge dédié recherche et vous propose des solutions prêtes à valider.",
  appleWebApp: {
    title: "Conciergerie",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#14120e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Premier élément au clavier : saute directement au contenu principal (#contenu). */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-[#f4f1ea] focus:px-4 focus:py-3 focus:font-medium focus:text-[#0e1a31] focus:outline-2 focus:outline-offset-2 focus:outline-[#c9a24e]"
        >
          Aller au contenu
        </a>
        <ToastContextProvider>
          {children}
          <Toaster />
        </ToastContextProvider>
      </body>
    </html>
  );
}
