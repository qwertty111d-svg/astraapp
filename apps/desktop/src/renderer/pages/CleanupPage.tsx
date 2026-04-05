import { useState } from "react";
import { ActionTile } from "../components/ActionTile";
import { Panel } from "../components/Panel";
import { astra } from "../lib/electron";
import type { OptimizationResult } from "../../main/types";

export function CleanupPage(): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const runCleanup = async () => {
    setBusy(true);
    const response = await astra.runAction("cleanup");
    setResult(response);
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <ActionTile title="Очистить мусор" description="Удаляет временные файлы, локальные кэши и корзину. Для тяжёлых Windows-сборок это часто даёт заметную передышку." badge="safe" busy={busy} onClick={() => void runCleanup()} />
        <Panel>
          <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">примечание</div>
          <h2 className="mt-2 text-3xl font-semibold">Что очищается</h2>
          <ul className="mt-4 space-y-3 text-[#9aa3bc]">
            <li>• %TEMP%</li>
            <li>• LocalAppData\Temp</li>
            <li>• Windows\Temp</li>
            <li>• D3DSCache / NVIDIA DXCache</li>
            <li>• Корзина</li>
          </ul>
        </Panel>
      </div>

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
