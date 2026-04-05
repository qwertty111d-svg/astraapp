import { useState } from "react";
import { ActionTile } from "../components/ActionTile";
import { Panel } from "../components/Panel";
import { astra } from "../lib/electron";
import type { OptimizationResult } from "../../main/types";

export function FpsPage(): JSX.Element {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const run = async (action: "fps" | "network") => {
    setBusy(action);
    const response = await astra.runAction(action);
    setResult(response);
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <ActionTile title="FPS Boost" description="Отключает Game DVR, включает high performance power plan и тюнит multimedia scheduler." badge="gaming" busy={busy === "fps"} onClick={() => void run("fps")} />
        <ActionTile title="Сетевой refresh" description="Сбрасывает Winsock и очищает DNS. После этого Windows может попросить перезагрузку." badge="restart" busy={busy === "network"} onClick={() => void run("network")} />
      </div>

      <Panel>
        <div className="text-xs uppercase tracking-[0.28em] text-[#aab3ce]">fps mode</div>
        <h2 className="mt-2 text-3xl font-semibold">Для игр и стриминга</h2>
        <p className="mt-4 max-w-[68ch] text-[#9aa3bc]">
          Astra не обещает магические +500 FPS, но прибирает самые типичные тормозные якоря: capture hooks, лишний latency overhead и базовые сетевые хвосты.
        </p>
      </Panel>

      {result ? (
        <Panel>
          <div className="text-xl font-semibold text-white">{result.summary}</div>
          {result.requiresRestart ? <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Для части изменений нужна перезагрузка.</div> : null}
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
