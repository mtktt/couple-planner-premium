import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Couple-Planner-Premium",
  description: "Premium Couple Calendar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-fredoka bg-[#E6CFF1] min-h-screen">
        {children}
      </body>
    </html>
  );
}