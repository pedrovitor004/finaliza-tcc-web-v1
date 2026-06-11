import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-b-[#359830]" />
        <p className="text-sm font-medium text-slate-500">Carregando...</p>
      </div>
    </div>
  );
}

function AuthenticatedHome() {
  const { logout, user } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f5] px-5 text-slate-900">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2f8f2b]">
          Finaliza TCC
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          Login realizado com sucesso
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Ola, {user?.nome || "usuario"}. As proximas telas do sistema podem ser
          adicionadas nos proximos commits.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2f8f2b] px-4 text-sm font-semibold text-white transition hover:bg-[#23731f]"
        >
          <LogOut size={17} />
          Sair
        </button>
      </section>
    </main>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AuthenticatedHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
