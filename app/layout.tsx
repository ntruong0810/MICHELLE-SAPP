import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  const description = "A quiet, paper-inspired place for months, weeks, and little plans.";

  return {
    title: {
      default: "Little Day Planner",
      template: "%s · Little Day Planner",
    },
    description,
    openGraph: {
      title: "Little Day Planner",
      description,
      images: [{ url: imageUrl, width: 1731, height: 909, alt: "Little Day Planner paper calendar" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Little Day Planner",
      description,
      images: [imageUrl],
    },
  };
}

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
