import { Link, Outlet, useLocation } from "react-router-dom";
import { Cpu, Gauge, Shield, Sparkles, Trash2, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { Panel } from "./Panel";
import type { ClientUser, LicenseInfo } from "../types";

const items = [
  { to: "/dashboard", label: "Кабинет", icon: UserRound },
  { to: "/optimizer", label: "Оптимизация", icon: Sparkles },
  { to: "/cleanup", label: "Очистка", icon: Trash2 },
  { to: "/fps", label: "FPS", icon: Gauge },
  { to: "/restore", label: "Безопасность", icon: Shield },
  { to: "/account", label: "Клиент", icon: Cpu },
];

export function AppShell({
  user,
  license,
}: {
  user: ClientUser;
  license: LicenseInfo | null;
}): JSX.Element {
  const location = useLocation();

  return (
    <div className="relative z-10 min-h-screen px-5 py-5 text-white">
      <div className="grid min-h-[calc(100vh-40px)] grid-cols-[108px_1fr] gap-5">
        <Panel className="sticky top-5 flex h-[calc(100vh-40px)] flex-col justify-between p-4">
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c4dff,#bc7cff)] text-xl font-bold shadow-astro">
              a
            </div>
            <div className="space-y-3">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className={cn(
                        "flex h-14 items-center justify-center rounded-2xl border transition",
                        active
                          ? "border-[#9877ff]/40 bg-[#8b5cf6]/18 text-white"
                          : "border-transparent bg-white/[0.02] text-[#a3adca] hover:border-[#8b5cf6]/15 hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className="size-5" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 p-3 text-center text-xs text-[#d8ceff]">
            {license?.plan ?? "FREE"}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="text-xl font-semibold tracking-tight">astra</div>
              <nav className="flex items-center gap-3 rounded-full border border-white/5 bg-black/10 px-3 py-2">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm transition",
                      location.pathname === item.to
                        ? "bg-[#8b5cf6]/20 text-white"
                        : "text-[#9fa9c7] hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#d4dcf8]">
              {user.name}
            </div>
          </Panel>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
