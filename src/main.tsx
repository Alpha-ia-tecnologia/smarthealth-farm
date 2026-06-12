import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/hooks/use-theme"
import { AuthProvider } from "@/context/auth"
import { ProvedorDados } from "@/context/provedor-dados"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BarraProgresso } from "@/components/layout/BarraProgresso"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <AuthProvider>
            <ProvedorDados>
              <BarraProgresso />
              <App />
            </ProvedorDados>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
