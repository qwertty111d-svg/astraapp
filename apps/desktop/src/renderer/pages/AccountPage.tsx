import { Panel } from "../components/Panel";
import type { ClientUser, LicenseInfo } from "../types";
import { formatDate } from "../lib/utils";

export function AccountPage({
  user,
  license,
}: {
  user: ClientUser;
  license: LicenseInfo | null;
}): JSX.Element {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-5">
        <Panel>
          <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">клиент</div>
          <h2 className="mt-2 text-3xl font-semibold">Управление аккаунтом</h2>
          <div className="mt-6 space-y-3">
            {[
              ["Имя", user.name],
              ["Email", user.email],
              ["Почта подтверждена", user.emailVerified ? "Да" : "Нет"],
              ["Тариф", license?.plan ?? user.plan ?? "FREE"],
              ["До", formatDate(license?.expiresAt ?? user.subscriptionEndsAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4">
                <div className="text-[#97a3c0]">{label}</div>
                <div className="font-medium text-white">{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">оплата</div>
          <h2 className="mt-2 text-3xl font-semibold">Тарифы и покупка</h2>
          <p className="mt-4 text-[#9aa3bc]">
            Покупка и управление подпиской живут на сайте. Приложение только читает твой доступ и запускает оптимизацию.
          </p>
          <button onClick={() => window.astra.openExternal(import.meta.env.VITE_PRICING_URL)} className="mt-6 rounded-2xl bg-[linear-gradient(135deg,#7c4dff,#b777ff)] px-5 py-3 font-semibold text-white shadow-astro">
            Открыть pricing
          </button>
          <button onClick={() => window.astra.openExternal(`${import.meta.env.VITE_SITE_URL}/account`)} className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-white">
            Открыть кабинет на сайте
          </button>
        </Panel>
      </div>
    </div>
  );
}
