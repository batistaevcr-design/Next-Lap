import type { ReactNode } from 'react'

type IconName = 'home'|'mural'|'search'|'user'|'plus'|'cam'|'bm'|'chev'|'back'|'x'|'pin'|'arr'|'fork'|'glass'|'leaf'|'mask'|'sett'|'pen'|'star'|'spark'|'heart'|'mic'

const PATHS: Record<IconName, ReactNode> = {
  home: <><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /></>,
  mural: <><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M8 21l4-4 4 4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  cam: <><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M9 7l1.5-3h3L15 7" /></>,
  bm: <><path d="M6 4h12v17l-6-4-6 4z" /></>,
  chev: <><path d="M9 5l7 7-7 7" /></>,
  back: <><path d="M15 5l-7 7 7 7" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  pin: <><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  arr: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  fork: <><path d="M7 3v8a2 2 0 004 0V3M9 11v10M17 3c-2 2-2 6 0 8v10" /></>,
  glass: <><path d="M6 4h12l-6 8zM12 12v8M8 20h8" /></>,
  leaf: <><path d="M5 19c0-9 5-14 15-14 0 10-5 15-15 15zM5 19l8-8" /></>,
  mask: <><path d="M4 5h16v6a8 8 0 01-16 0z" /><path d="M8 11h2M14 11h2M9 15c2 1.5 4 1.5 6 0" /></>,
  sett: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  pen: <><path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" /></>,
  star: <><path d="M12 3l2.6 5.6 6 .7-4.4 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.4 9.3l6-.7z" /></>,
  spark: <><path d="M12 2c.6 5 2.4 8 8 10-5.6 2-7.4 5-8 10-.6-5-2.4-8-8-10 5.6-2 7.4-5 8-10z" /></>,
  heart: <><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 10a6 6 0 0012 0M12 16v5M8.5 21h7" /></>,
}

export function Icon({ name, className = 'i' }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>
}
