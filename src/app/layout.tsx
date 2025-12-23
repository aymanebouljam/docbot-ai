import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DocBot AI",
  description: "A medical-only chatbot for health-related questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-theme="light">
      <body className="min-h-full bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}
