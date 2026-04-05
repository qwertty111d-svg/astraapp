import { motion } from "framer-motion";
import { Panel } from "./Panel";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): JSX.Element {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="min-h-[124px]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9ea7c5]">{label}</p>
        <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
        {hint ? <p className="mt-2 text-sm text-[#98a3bf]">{hint}</p> : null}
      </Panel>
    </motion.div>
  );
}
