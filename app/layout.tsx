import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMAS — документы на визу",
  description: "Чек-лист документов для визы студента и опекуна IMAS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-[#f5f4f0] text-[#1a1a18]">
        {children}
      </body>
    </html>
  );
}
