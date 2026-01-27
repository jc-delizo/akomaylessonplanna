import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { generateOrganizationSchema, generateWebSiteSchema, generateSiteNavigationSchema } from "@/lib/seo/schema-org";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://akomaylessonplanna.com";

export const metadata: Metadata = {
  title: "Ako may lesson plan na!",
  description: "A marketplace for educational resources including lesson plans, exams, RPMS, posters, and tarpaulins for teachers",
  openGraph: {
    title: "Ako may lesson plan na!",
    description: "A marketplace for educational resources including lesson plans, exams, RPMS, posters, and tarpaulins for teachers",
    url: baseUrl,
    siteName: "Ako may lesson plan na!",
    type: "website",
    images: [{ url: `${baseUrl}/akomaylogo.png`, width: 192, height: 192, alt: "Ako may lesson plan na!" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ako may lesson plan na!",
    description: "A marketplace for educational resources including lesson plans, exams, RPMS, posters, and tarpaulins for teachers",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/akomaylogo.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' }
    ]
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#ff7200', // orange logo color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();
  const navigationSchema = generateSiteNavigationSchema();

  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
        />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
