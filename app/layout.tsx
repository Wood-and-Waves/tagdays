import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tag Days | Huntley High School Band Boosters",
  description: "Sign up to volunteer for Huntley High School Band Boosters Tag Days.",
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
