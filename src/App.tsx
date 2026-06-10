import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Skeleton } from "@/components/ui/skeleton"

const LoginPage = lazy(() => import("@/pages/LoginPage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const OperacionalPage = lazy(() => import("@/pages/OperacionalPage"))
const PrevisaoPage = lazy(() => import("@/pages/PrevisaoPage"))
const EstoquePage = lazy(() => import("@/pages/EstoquePage"))
const AlertasPage = lazy(() => import("@/pages/AlertasPage"))
const RecomendacoesPage = lazy(() => import("@/pages/RecomendacoesPage"))
const RelatoriosPage = lazy(() => import("@/pages/RelatoriosPage"))
const IngestaoPage = lazy(() => import("@/pages/IngestaoPage"))
const IntegracaoPage = lazy(() => import("@/pages/IntegracaoPage"))
const SegurancaPage = lazy(() => import("@/pages/SegurancaPage"))
const AdminPage = lazy(() => import("@/pages/AdminPage"))
const IndicadoresPage = lazy(() => import("@/pages/IndicadoresPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

function PageFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Rota pública de autenticação */}
      <Route
        path="/login"
        element={
          <Suspense fallback={null}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Aplicação protegida: exige sessão válida */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            element={
              <Suspense fallback={<PageFallback />}>
                <RouteOutlet />
              </Suspense>
            }
          >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/operacional" element={<OperacionalPage />} />
          <Route path="/previsao" element={<PrevisaoPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/recomendacoes" element={<RecomendacoesPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/ingestao" element={<IngestaoPage />} />
          <Route path="/integracao" element={<IntegracaoPage />} />
          <Route path="/seguranca" element={<SegurancaPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

import { Outlet } from "react-router-dom"
function RouteOutlet() {
  return <Outlet />
}
