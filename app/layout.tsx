import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Web3Provider from '@/components/providers/Web3Provider'
import AmbientMarketStrip from '@/components/market/AmbientMarketStrip'
import ErrorSanitizerProvider from '@/components/providers/ErrorSanitizerProvider'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'BeyondFleet - AI 기반 금융 리터러시 및 의사결정 교육 플랫폼',
  description: '시장과 경제를 이해하고 스스로 판단하는 힘을 기르는 AI 기반 금융 리터러시 교육 플랫폼입니다.',
  keywords: ['금융 리터러시', '거시경제 학습', '의사결정 훈련', 'AI 경제 리서치', '데일리 브리프'],
  authors: [{ name: 'BeyondFleet Team' }],
  openGraph: {
    title: 'BeyondFleet - AI 기반 금융 리터러시 및 의사결정 교육 플랫폼',
    description: '시장과 경제를 이해하고 스스로 판단하는 힘을 기르는 AI 기반 금융 리터러시 교육 플랫폼입니다.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <html lang="ko" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {pixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ErrorSanitizerProvider>
          <Web3Provider>
            <Header />
            <main className="flex-grow pt-16">
              <AmbientMarketStrip />
              {children}
            </main>
            <Footer />
          </Web3Provider>
        </ErrorSanitizerProvider>
      </body>
    </html>
  )
}

