// Modified for the Yinghuo Career web edition.
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "萤火职航工作台",
  description: "查找校招与实习机会，准备简历、跟踪投递并备战面试。",
  icons: {
    icon: "/brand/roxy-career.svg",
    shortcut: "/brand/roxy-career.svg",
    apple: "/brand/roxy-career.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={cn("font-sans", geist.variable)}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
