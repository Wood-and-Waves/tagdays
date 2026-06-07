import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tag Days 2026 | Huntley High School Marching Band",
  description: "Sign up to volunteer for Huntley High School Marching Band Tag Days 2026.",
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
