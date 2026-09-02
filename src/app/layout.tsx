import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SCORE Signals",
  description: "Creative intelligence for original brand concepts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
