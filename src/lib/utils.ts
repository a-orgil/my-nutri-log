import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付文字列（YYYY-MM-DD）をUTC日付オブジェクトに変換
 * Prismaの@db.Dateフィールドとの比較用
 */
export function parseToUTCDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00.000Z");
}

/**
 * 日付の範囲を取得（開始日と翌日）
 * @db.Dateフィールドの範囲検索用
 */
export function getDateRange(dateString: string): { start: Date; end: Date } {
  const start = parseToUTCDate(dateString);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/**
 * 月の開始日と終了日をUTCで取得
 */
export function getMonthRangeUTC(
  year: number,
  month: number
): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}
