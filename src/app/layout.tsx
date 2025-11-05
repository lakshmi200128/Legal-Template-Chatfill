import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Template Chatfill",
  description:
    "Upload a legal template, chat through each placeholder, and download a completed draft in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
