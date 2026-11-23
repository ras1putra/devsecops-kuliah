import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon Sales | Ringkasan Penjualan",
  description: "Dashboard ringkasan penjualan Axon Sales dengan data contoh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
