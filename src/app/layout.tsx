import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { Notifications } from '@/components/shared/Notifications'
import { AppProvider } from '@/lib/store'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TripCanvas — Plan Unforgettable Trips',
  description: 'Discover destinations, build itineraries, compare stays, and split costs with friends. Your all-in-one trip planning platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Notifications />
        </AppProvider>
      </body>
    </html>
  )
}
