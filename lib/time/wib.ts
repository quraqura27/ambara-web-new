export const WIB_TIME_ZONE = "Asia/Jakarta";

function validDate(value: Date | string | number | null | undefined) {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWibDateTime(value: Date | string | number | null | undefined, fallback = "-") {
  const date = validDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: WIB_TIME_ZONE,
  }).format(date) + " WIB";
}

export function formatWibDate(value: Date | string | number | null | undefined, fallback = "-") {
  const date = validDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

export function toWibDateTimeLocalValue(value: Date | string | number | null | undefined) {
  const date = validDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
