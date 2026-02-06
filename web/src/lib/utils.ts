import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url.startsWith('http')
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
}
