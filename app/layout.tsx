import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'

export const metadata = {
  title: 'GMAT Focus Prep',
  description: 'GMAT Focus Edition practice and AI tutor'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
