import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "GeoGuard - GIS-Based Illegal Mining Detection Platform",
  description: "Protecting Ghana's Natural Heritage through advanced technology and community action",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css" />
        <link rel="preload" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" as="style" />
        <link rel="preload" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" as="script" />
        <link rel="prefetch" href="/license" as="document" />
        <script dangerouslySetInnerHTML={{
          __html: `
          // Preload license page resources
          document.addEventListener('DOMContentLoaded', function() {
            // Preload the map component when the homepage loads
            const mapPreloader = new Image();
            mapPreloader.src = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
            
            // Create a hidden link to prefetch the license page
            const linkElement = document.createElement('link');
            linkElement.rel = 'prefetch';
            linkElement.href = '/license';
            linkElement.as = 'document';
            document.head.appendChild(linkElement);
          });
          `
        }} />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
