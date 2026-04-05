import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { login } from "../lib/api";
import { Panel } from "../components/Panel";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1080px]">
        <Panel className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-white/5 bg-[linear-gradient(180deg,rgba(8,12,25,0.9),rgba(3,5,11,0.95))] p-8">
            <div className="inline-flex rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#d7cbff]">
              astra • desktop
            </div>
            <h1 className="mt-6 max-w-[12ch] text-6xl font-semibold leading-[0.95]">
              Раскрой потенциал компьютера <span className="text-[#b691ff]">с Astra</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-8 text-[#9ea7c5]">
              Вход идёт через твой сайт. После входа приложение проверяет тариф и открывает нужные функции.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {["Windows 10/11", "Откат в 1 клик", "Для игр и стриминга", "Тёмный премиум UI"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#b5bfda]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-[24px] border border-white/5 bg-black/10 p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-[#9ea7c5]">Вход в кабинет</div>
            <h2 className="mt-3 text-3xl font-semibold">Продолжить</h2>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[#b4bdd7]">Почта</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#8b5cf6]/40" placeholder="you@gmail.com" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#b4bdd7]">Пароль</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#8b5cf6]/40" placeholder="••••••••" />
              </label>
            </div>

            {error ? <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <button type="submit" disabled={loading} className="mt-6 w-full rounded-2xl bg-[linear-gradient(135deg,#7c4dff,#b777ff)] px-5 py-3 font-semibold text-white shadow-astro transition hover:opacity-95">
              {loading ? "Входим..." : "Войти"}
            </button>

            <button type="button" onClick={() => window.astra.openExternal(import.meta.env.VITE_PRICING_URL)} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-[#d7dbff] transition hover:border-[#8b5cf6]/30">
              Открыть цены в браузере
            </button>

            <p className="mt-6 text-sm text-[#9ea7c5]">
              Нет аккаунта? <Link className="text-[#d4c4ff]" to="/register">Зарегистрироваться</Link>
            </p>
          </form>
        </Panel>
      </motion.div>
    </div>
  );
}
