import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/course.css";
import { Toaster } from "@/ui/primitives";
import { AppSetup } from "@/features/app/AppSetup";

export const metadata: Metadata = {
  title: "Ateliê — autoria de treinamentos",
  description: "Crie treinamentos e-learning interativos com um editor visual baseado em blocos.",
  applicationName: "Ateliê",
  appleWebApp: { capable: true, title: "Ateliê", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#101116" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        {children}
        <Toaster />
        <AppSetup />
      </body>
    </html>
  );
}
