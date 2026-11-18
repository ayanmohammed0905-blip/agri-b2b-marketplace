import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Kannada } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";
import "./theme.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada", "latin"],
});

export const metadata: Metadata = {
  title: "Agri Marketplace",
  description: "Direct farmer-to-buyer agricultural marketplace",
};

// Runs before the page paints, so there is no light/dark flash.
// Default is dark unless the user previously chose light.
const themeScript = `
try {
  var t = localStorage.getItem("theme");
  if (t !== "light") document.documentElement.classList.add("dark");
} catch (e) {
  document.documentElement.classList.add("dark");
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoKannada.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}