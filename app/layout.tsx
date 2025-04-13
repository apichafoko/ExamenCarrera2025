import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Image from "next/image"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"
import { RouteGuard } from "@/components/route-guard"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ExamenCarrera - Sistema de Evaluación Académica",
  description: "Sistema para la gestión y evaluación de exámenes académicos",
  generator: "Uriel Fraidenraij",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RouteGuard>
              <AppProvider>
                <div className="flex flex-col min-h-screen">
                  <MainNav />
                  <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
                  <footer className="py-6 border-t bg-muted/40">
                    <div className="container mx-auto px-4 text-center">
                      <div className="flex justify-center mb-4">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-E6cObsYKXSKMv2Y2PidoSHrcoylfWw.png"
                          alt="Asociación de Anestesia Analgesia y Reanimación de Buenos Aires"
                          width={300}
                          height={80}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} ExamenCarrera - Sistema de Evaluación Académica - Desarrollado por
                        Uriel Fraidenraij
                      </div>
                    </div>
                  </footer>
                </div>
              </AppProvider>
            </RouteGuard>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'