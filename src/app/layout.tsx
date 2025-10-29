import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexoPixel - Seu Hub de Cultura Geek",
  description: "Blog automatizado sobre Cinema, Séries, Animes e Jogos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Sugestão: Mudar para pt-br (Português do Brasil)
    <html lang="pt-br">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
