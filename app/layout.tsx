import type { Metadata } from "next";
import "./globals.css";

// The site outgrew its name: it started as Tag Days and now carries concession
// nights and anything else the boosters need hands for. The old title was the
// headline on every link preview, so a post sharing the signup read "Tag Days"
// over a concessions schedule — enough that Angela wrote "(This is the sign up
// we will use even though it says tag days)" into her own post to explain it.
//
// openGraph is set so a preview card is something we WROTE rather than whatever
// text the scraper happened to find first on the page.
const SITE_NAME = "Huntley High School Band Boosters"
const SITE_TITLE = `Volunteer Signup | ${SITE_NAME}`
const SITE_DESCRIPTION =
  "Sign up to volunteer at Huntley High School Band Boosters events — concessions, Tag Days and more."

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
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
