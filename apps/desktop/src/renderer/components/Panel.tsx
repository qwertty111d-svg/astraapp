import type { PropsWithChildren } from "react";
import { cn } from "../lib/utils";

export function Panel({
  children,
  className,
}: PropsWithChildren<{ className?: string }>): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-astraborder bg-[linear-gradient(180deg,rgba(10,15,30,0.86),rgba(6,9,20,0.92))] p-5 shadow-astro backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
