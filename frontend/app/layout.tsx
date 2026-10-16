import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/queries/QueryProvider";

export const metadata: Metadata = {
  title: "iPSC Colony Analysis",
  description: "Scientific microscopy analysis workstation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
