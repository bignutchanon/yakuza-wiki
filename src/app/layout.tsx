import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import CookieConsent from '@/components/CookieConsent'
import HashRedirect from '@/components/HashRedirect'
import JsonLd from '@/components/JsonLd'
import { siteJsonLd } from '@/lib/seo'
import { pageMeta, SITE_URL, DEFAULT_DESCRIPTION, AUTHOR_NAME, CONTACT_EMAIL, GTM_ID } from '@/lib/site'
import '@/styles.css'

// metadata ของหน้าแรก (title ว่าง → ใช้ชื่อเว็บอย่างเดียว) — หน้าอื่นจะ override ผ่าน export const metadata ของตัวเอง
export const metadata: Metadata = {
  ...pageMeta({ title: '', description: DEFAULT_DESCRIPTION, path: '/' }),
  metadataBase: new URL(SITE_URL),
  other: { 'google-adsense-account': 'ca-pub-8021468402008200' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,400;0,600;0,700;0,800;1,600;1,700;1,800&family=Sarabun:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Google Tag Manager — ตัวจัดการแท็ก (GA4 ฯลฯ ตั้งค่าใน GTM ไม่ต้องแก้โค้ด) · ค่าที่เลือกในแบนเนอร์คุกกี้ถูก push เข้า dataLayer เป็น cookie_consent ให้แท็กใช้เป็น trigger ได้ */}
        {GTM_ID && (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ event: 'cookie_consent', cookieConsent: localStorage.getItem('cookieConsent') || 'unset' });
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}

        {/* Organization + WebSite — ติดไปทุกหน้าเพราะอยู่ใน layout หน้าอื่นเพิ่มโหนดของตัวเองต่อได้ */}
        <JsonLd data={siteJsonLd()} />

        {/* ผู้ใช้เลือก "เฉพาะที่จำเป็น" ในแบนเนอร์คุกกี้ → ขอโฆษณาแบบไม่อิงตัวตน ต้องตั้งก่อนสคริปต์ adsbygoogle เริ่มทำงาน */}
        <Script id="ads-consent" strategy="beforeInteractive">
          {`if (localStorage.getItem('cookieConsent') === 'essential') {
            (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
          }`}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8021468402008200"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <div className="app">
          <Navbar />
          <div className="main">
            {children}
            <footer className="site-footer">
              <p className="footer-support">
                เว็บนี้ทำด้วยใจโดยแฟนเกม — ถ้ามีประโยชน์{' '}
                <Link href="/support">เลี้ยงกาแฟผู้จัดทำได้ที่นี่ ♥</Link>
              </p>
              เว็บ wiki โดยแฟนเกม ทำขึ้นเพื่อแชร์ในกลุ่มผู้เล่นเท่านั้น ไม่มีส่วนเกี่ยวข้องกับ SEGA / Ryu Ga Gotoku Studio
              <br />
              ภาพประกอบทั้งหมด © SEGA — ใช้เพื่อการอ้างอิงพร้อมระบุที่มาใต้ภาพ
              <br />
              เขียนและดูแลโดย <Link href="/about">{AUTHOR_NAME}</Link> — ติดต่อ{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <br />
              <Link href="/about">เกี่ยวกับเว็บนี้</Link>
              {' · '}
              <Link href="/report">แจ้งบั๊กม็อด</Link>
              {' · '}
              <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link>
            </footer>
            <CookieConsent />
          </div>
        </div>
        <HashRedirect />
      </body>
    </html>
  )
}
