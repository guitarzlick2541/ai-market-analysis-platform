import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'AI Market Analysis | Real-Time Trading Intelligence',
    description: 'AI-powered real-time market analysis platform for Stocks, Crypto, and Gold using FinBERT sentiment analysis and TFT/LSTM price prediction.',
    keywords: ['trading', 'AI', 'market analysis', 'cryptocurrency', 'stocks', 'gold', 'sentiment analysis'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} antialiased`}>
                {children}
            </body>
        </html>
    )
}
