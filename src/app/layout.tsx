import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Louve - Ministério de Louvor",
  description: "Sistema de Gestão do Ministério de Louvor",
  icons: {
    icon: '/favicon.svg?v=' + Date.now(),
    shortcut: '/favicon.svg?v=' + Date.now(),
    apple: '/favicon.svg?v=' + Date.now(),
  },
};

function CacheBuster() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var CURRENT = "${Date.now()}";
            var KEY = "__louve_version__";
            var prev = sessionStorage.getItem(KEY);
            if (prev && prev !== CURRENT) {
              sessionStorage.removeItem(KEY);
              location.reload(true);
              return;
            }
            sessionStorage.setItem(KEY, CURRENT);
            window.addEventListener("pageshow", function(e) {
              if (e.persisted) { location.reload(true); }
            });
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <head>
        <CacheBuster />
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
      </head>
      <body className="min-h-full bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
