import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Home Depot Clearance Deals',
  description: 'Exclusive clearance deals for members only',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

