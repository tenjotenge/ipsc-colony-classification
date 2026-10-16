import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/queries/QueryProvider";

export const metadata: Metadata = {
  title: "Colony Atlas | iPSC morphology workspace",
  description: "Spatial review prototype for iPSC colony imagery",
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
