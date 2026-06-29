import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomSplit - Shared Room Expense Tracker",
  description: "Track and manage shared room expenses efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased dark"
    >
      <body className="min-h-full">
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
