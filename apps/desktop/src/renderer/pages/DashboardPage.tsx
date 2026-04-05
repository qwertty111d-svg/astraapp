import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "../components/StatCard";
import { Panel } from "../components/Panel";
import { astra } from "../lib/electron";
import { formatDate } from "../lib/utils";
import type { LicenseInfo } from "../types";
import type { SystemOverview } from "../../main/types";

export function DashboardPage({ license }: { license: LicenseInfo | null }): JSX.Element {
  const [overview, setOverview] = useState<SystemOverview | null>(null);

  useEffect(() => {
    void astra.getSystemOverview().then(setOverview);
  }, []);

  if (!overview) return <div className="text-[#9ea7c5]">Загружаем систему...</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1.35fr_0.95fr] gap-5">
        <Panel className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[96px_1fr]">
            <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-[linear-gradient(135deg,#7c4dff,#b777ff)] text-4xl font-bold">
              C
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">личный кабинет</div>
              <div className="mt-2 text-6xl font-semibold leading-[0.95]">Управление аккаунтом</div>
              <p className="mt-4 max-w-[54ch] text-[#9aa3bc]">
                Профиль, тариф, активные сессии и последние действия аккаунта. Windows-машина уже на радарах Astra.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {["Управление тарифом", "Безопасность", "Проверка платежей"].map((label) => (
                  <button key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-[#8b5cf6]/30">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">текущий тариф</div>
              <div className="mt-2 text-5xl font-semibold">{license?.plan ?? "FREE"}</div>
            </div>
            <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/15 px-3 py-1 text-xs text-[#d8ceff]">
              {license?.active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <StatCard label="Осталось" value={license?.plan === "LIFETIME" ? "∞" : (license?.expiresAt ? formatDate(license.expiresAt) : "—")} />
            <StatCard label="Действует до" value={license?.expiresAt ? formatDate(license.expiresAt) : "—"} />
            <StatCard label="Оплата" value={license?.active ? "Оплачено" : "Ожидается"} />
            <StatCard label="Устройства" value={String(license?.deviceLimit ?? 1)} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel>
          <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">профиль</div>
          <h3 className="mt-2 text-3xl font-semibold">Основная информация</h3>
          <div className="mt-6 space-y-3">
            {[
              ["Имя устройства", overview.deviceName],
              ["ОС", overview.osName],
              ["Сборка", overview.osBuild],
              ["CPU", overview.cpu],
              ["Последний snapshot", formatDate(overview.lastSnapshotAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4 text-sm">
                <span className="text-[#99a4c1]">{label}</span>
                <span className="max-w-[60%] text-right text-white">{value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">система</div>
              <h3 className="mt-2 text-3xl font-semibold">Активные сессии</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#c6cde7]">1 всего</span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[#99a4c1]">Текущее устройство</div>
              <div className="mt-2 text-xl font-semibold">Desktop session</div>
              <div className="mt-3 text-sm text-[#9aa3bb]">Последняя активность только что</div>
            </div>

            <div className="rounded-3xl border border-[#8b5cf6]/18 bg-[#8b5cf6]/8 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[#cdbfff]" />
                <div className="font-medium text-white">{overview.isAdmin ? "Запуск с правами администратора" : "Обычный режим"}</div>
              </div>
              <p className="mt-3 text-sm text-[#b0b7cf]">
                {overview.isAdmin ? "Системные функции уже доступны." : "Для части твиков Windows попросит UAC подтверждение."}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">журнал</div>
            <h3 className="mt-2 text-3xl font-semibold">Последние действия</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#c6cde7]">
            3 события
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {[
            ["system_scan_completed", "Локальный анализ системы обновлён."],
            ["restore_point_ready", "Точка восстановления может быть создана в один клик."],
            ["pricing_redirect_available", "Покупка тарифа откроется в браузере."],
          ].map(([title, details], index) => (
            <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4">
              <div className="flex items-start gap-3">
                <Star className="mt-1 size-4 text-[#b691ff]" />
                <div>
                  <div className="font-medium text-white">{title}</div>
                  <div className="mt-1 text-sm text-[#99a4c1]">{details}</div>
                </div>
              </div>
              <Sparkles className="size-4 text-[#7b67ff]" />
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
