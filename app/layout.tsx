
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PSX MCP Gateway",
  description: "Pakistan Stock Exchange MCP Gateway",
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
