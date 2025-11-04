import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const open_sans = Manrope({
  variable: "--font-open-sans",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Uadmin ",
  description: "Underla app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
      <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            {/* <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          /> */}
          </head>
          <body className={`${open_sans.variable} font-sans`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <TRPCReactProvider>
                {children}
                <Toaster position="top-right" />
              </TRPCReactProvider>
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </NuqsAdapter>
  );
}
