import { motion } from "framer-motion";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Panel } from "./Panel";

export function ActionTile({
  title,
  description,
  badge,
  busy,
  onClick,
}: {
  title: string;
  description: string;
  badge?: string;
  busy?: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <motion.button
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      disabled={busy}
      className="text-left"
    >
      <Panel className="h-full transition duration-300 hover:border-[#9d7dff]/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            <p className="mt-2 text-sm leading-6 text-[#9aa3bb]">{description}</p>
          </div>
          {badge ? (
            <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/15 px-3 py-1 text-xs text-[#d8ceff]">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#d5cbff]">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {busy ? "Выполняется..." : "Запустить"}
        </div>
      </Panel>
    </motion.button>
  );
}
