import type { Metadata } from "next";
import "./globals.css";

const description = "A quiet, paper-inspired place for months, weeks, and little plans.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Michelle's Day Planner",
    template: "%s · Michelle's Day Planner",
  },
  description,
  openGraph: {
    title: "Michelle's Day Planner",
    description,
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Michelle's Day Planner paper calendar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Michelle's Day Planner",
    description,
    images: ["/og.png"],
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
