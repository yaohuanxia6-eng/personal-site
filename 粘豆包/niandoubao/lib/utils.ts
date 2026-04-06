import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 给 fetch 路径加上 basePath 前缀，并补尾部斜杠（trailingSlash: true） */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '/projects/zhandoubao'
  const full = `${base}${path}`
  return full.endsWith('/') ? full : `${full}/`
}
