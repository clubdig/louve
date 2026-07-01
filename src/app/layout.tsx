import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Louve - Ministério de Louvor",
  description: "Sistema de Gestão do Ministério de Louvor",
  icons: {
    icon: '/favicon.svg?t=' + Date.now(),
  },
};

const BUILD_TIME = Date.now().toString();

function CacheBuster() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){
          var K="__v__";
          try{
            var c=document.cookie.match(new RegExp(K+"=([^;]+)"));
            var old=c?c[1]:null;
            if(old&&old!=="${BUILD_TIME}"){
              document.cookie=K+"=${BUILD_TIME};path=/;max-age=31536000";
              location.reload(true);
              return;
            }
            document.cookie=K+"=${BUILD_TIME};path=/;max-age=31536000";
          }catch(e){}
          window.addEventListener("pageshow",function(e){
            if(e.persisted){location.reload(true)}
          });
          window.addEventListener("popstate",function(){
            location.reload(true);
          });
        })()`,
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
      </head>
      <body className="min-h-full bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
