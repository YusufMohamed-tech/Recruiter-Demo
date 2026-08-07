import type { Metadata } from 'next'
import { Poppins, Sora, Kanit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-nav',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Chessboard Recruitment',
    default: 'Chessboard Recruitment',
  },
  description: 'Saudi Recruitment & Employment Readiness Platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${poppins.variable} ${sora.variable} ${kanit.variable}`}
    >
      <body className="bg-white text-brand-dark font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
