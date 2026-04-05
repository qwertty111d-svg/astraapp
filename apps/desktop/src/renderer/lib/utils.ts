import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>): string {
  return clsx(values);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
