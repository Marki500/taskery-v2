import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TimerProvider } from "@/contexts/timer-context";
import { ThemeProvider } from "next-themes";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taskery",
  description: "Project Management for High Performers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${nunito.variable} font-sans antialiased text-lg`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TimerProvider>
            {children}
          </TimerProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

