import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Roboto is the primary typeface defined in design-tokens.json under
// typography.fontFamily.brand. Loading it via next/font/google ensures
// self-hosting, zero layout shift, and optimal performance.
const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyFlow",
  description: "StudyFlow — Authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
