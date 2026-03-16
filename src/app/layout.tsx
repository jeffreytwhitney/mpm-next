import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AuthUserProvider } from "@/components/AuthUserProvider";
import { SiteProvider } from "@/components/SiteProvider";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { resolveSiteID, SITE_COOKIE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metrology Ticket System",
  description: "Metrology Ticket System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const cookieStore = await cookies();
  const cookieSiteID = cookieStore.get(SITE_COOKIE_NAME)?.value;
  const initialSiteID = resolveSiteID(undefined, cookieSiteID);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthUserProvider initialUser={currentUser}>
          <SiteProvider initialSiteID={initialSiteID}>
            {children}
          </SiteProvider>
        </AuthUserProvider>
      </body>
    </html>
  );
}
