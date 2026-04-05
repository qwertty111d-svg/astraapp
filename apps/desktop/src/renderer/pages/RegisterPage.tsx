import { Link } from "react-router-dom";
import { Panel } from "../components/Panel";

export function RegisterPage(): JSX.Element {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <Panel className="w-full max-w-[720px] p-8">
        <div className="text-sm uppercase tracking-[0.28em] text-[#9ea7c5]">Создание профиля</div>
        <h1 className="mt-2 text-4xl font-semibold">Новый аккаунт Astra</h1>
        <p className="mt-6 text-[#aab3ce]">
          Регистрация сейчас идёт на сайте. Нажми кнопку ниже, создай аккаунт в браузере и вернись сюда.
        </p>

        <div className="mt-8 grid gap-4">
          <button
            type="button"
            onClick={() => window.astra.openExternal(`${import.meta.env.VITE_SITE_URL}/register`)}
            className="rounded-2xl bg-[linear-gradient(135deg,#7c4dff,#b777ff)] px-5 py-3 font-semibold text-white"
          >
            Открыть регистрацию на сайте
          </button>

          <Link to="/login" className="text-sm text-[#cdbfff]">
            Уже есть аккаунт
          </Link>
        </div>
      </Panel>
    </div>
  );
}
