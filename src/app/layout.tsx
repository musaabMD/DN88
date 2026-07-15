import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono, Nunito, Source_Serif_4 } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProviderWrapper";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const articleSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-article-serif-fallback",
  display: "swap",
});

const articleMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-article-mono-fallback",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drnote.co"),
  title: "DrNote",
  description: "Study smarter with DrNote",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        nunito.variable,
        "font-sans",
        geist.variable,
        articleSerif.variable,
        articleMono.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-B0QJB3Q649"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-B0QJB3Q649');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("drnote-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full antialiased">
        <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
      </body>
    </html>
  );
}
