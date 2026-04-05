import { useState } from "react";
import { ActionTile } from "../components/ActionTile";
import { Panel } from "../components/Panel";
import { astra } from "../lib/electron";
import type { OptimizationResult } from "../../main/types";

export function RestorePage(): JSX.Element {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const runCreate = async () => {
    setBusy("create");
    const response = await astra.createRestorePoint();
    setResult(response);
    setBusy(null);
  };

  const runRollback = async () => {
    setBusy("rollback");
    const response = await astra.rollback();
    setResult(response);
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <ActionTile title="Создать restore point" description="Просит Windows создать точку восстановления перед тяжёлыми изменениями." badge="safe" busy={busy === "create"} onClick={() => void runCreate()} />
        <ActionTile title="Откатить последний snapshot" description="Восстанавливает backed-up registry and service values Astra." badge="rollback" busy={busy === "rollback"} onClick={() => void runRollback()} />
      </div>

      <Panel>
        <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">безопасность</div>
        <h2 className="mt-2 text-3xl font-semibold">Что Astra откатывает</h2>
        <ul className="mt-4 grid gap-3 text-[#9aa3bc]">
          <li>• Registry values, которые меняет приложение</li>
          <li>• Режимы запуска изменённых служб</li>
          <li>• Активную схему питания</li>
          <li>• Cleanup не возвращает удалённый мусор. Тут даже некромант бы вспотел.</li>
        </ul>
      </Panel>

      {result ? (
        <Panel>
          <div className="text-xl font-semibold text-white">{result.summary}</div>
          <div className="mt-4 space-y-3">
            {result.entries.map((entry) => (
              <div key={entry.label} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4 text-sm text-[#b1bad3]">
                <div className="font-medium text-white">{entry.label}</div>
                <div className="mt-1">{entry.details}</div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
