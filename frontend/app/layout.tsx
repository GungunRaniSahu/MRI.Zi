import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MRI.Zi — Deformable Brain-MRI Registration",
  description:
    "Interactive deformable registration playground plus deep-learning research results (VoxelMorph, TransMorph) on the OASIS brain-MRI dataset.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
