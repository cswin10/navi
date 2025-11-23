import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaviOS - Your Personal AI Operating System",
  description: "Voice-first AI personal operating system that executes real actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
