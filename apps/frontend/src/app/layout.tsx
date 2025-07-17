import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = localFont({
  src: [
    {
      path: "../assets/fonts/Inter-Variable.woff2",
      weight: "100 900",
      style: "normal"
    }
  ],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "SalonFlow",
  description: "Güzellik Salonu Yönetim Platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
