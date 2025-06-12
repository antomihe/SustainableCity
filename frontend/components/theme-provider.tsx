// frontend\components\theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render nothing on server and before client hydration to prevent mismatch
    return null
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
