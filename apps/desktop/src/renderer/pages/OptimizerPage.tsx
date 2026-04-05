import { useState } from "react";
import { motion } from "framer-motion";
import { ActionTile } from "../components/ActionTile";
import { Panel } from "../components/Panel";
import { astra } from "../lib/electron";
import type { OptimizationResult } from "../../main/types";

export function OptimizerPage(): JSX.Element {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const run = async (action: "all" | "services" | "registry") => {
    setBusy(action);
    const response = await astra.runAction(action);
    setResult(response);
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-5">
        <ActionTile title="Astra One Click" description="Полный профиль: очистка, FPS-пакет, отключение безопасного набора телеметрии и registry tweaks." badge="рекомендуется" busy={busy === "all"} onClick={() => void run("all")} />
        <ActionTile title="Службы" description="Отключает небольшую безопасную группу фоновых сервисов с откатом." busy={busy === "services"} onClick={() => void run("services")} />
        <ActionTile title="Реестр" description="Подправляет shell responsiveness и мультимедийные значения." busy={busy === "registry"} onClick={() => void run("registry")} />
      </div>

      <Panel>
        <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">как это работает</div>
        <h2 className="mt-2 text-3xl font-semibold">Профиль оптимизации</h2>
        <p className="mt-4 max-w-[70ch] text-[#99a4c1]">
          Перед системными изменениями Astra создаёт snapshot и пытается запросить restore point у Windows. Это не магия из
          тёмного подвала, а аккуратный набор повторяемых шагов.
        </p>
      </Panel>

      {result ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">результат</div>
                <h3 className="mt-2 text-3xl font-semibold">{result.summary}</h3>
              </div>
              {result.snapshotPath ? <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/12 px-3 py-1 text-xs text-[#d8ceff]">snapshot ready</span> : null}
            </div>

            <div className="mt-6 space-y-3">
              {result.entries.map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium text-white">{entry.label}</div>
                    <div className={`rounded-full px-3 py-1 text-xs ${entry.success ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                      {entry.success ? "ok" : "warning"}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[#98a3bf]">{entry.details}</div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      ) : null}
    </div>
  );
}
