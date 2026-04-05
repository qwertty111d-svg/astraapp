import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { AppShell } from "./components/AppShell";
import { useAppSession } from "./hooks/useAppSession";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OptimizerPage } from "./pages/OptimizerPage";
import { CleanupPage } from "./pages/CleanupPage";
import { FpsPage } from "./pages/FpsPage";
import { RestorePage } from "./pages/RestorePage";
import { AccountPage } from "./pages/AccountPage";

export default function App(): JSX.Element {
  const session = useAppSession();

  return (
    <>
      <AnimatedBackground />
      {session.loading ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center text-lg text-white">Запускаем Astra…</div>
      ) : (
        <Routes>
          <Route path="/login" element={session.user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={session.user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          {session.user ? (
            <Route element={<AppShell user={session.user} license={session.license} />}>
              <Route path="/dashboard" element={<DashboardPage license={session.license} />} />
              <Route path="/optimizer" element={<OptimizerPage />} />
              <Route path="/cleanup" element={<CleanupPage />} />
              <Route path="/fps" element={<FpsPage />} />
              <Route path="/restore" element={<RestorePage />} />
              <Route path="/account" element={<AccountPage user={session.user} license={session.license} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      )}
    </>
  );
}
