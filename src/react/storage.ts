import type { Completion, Experience, Profile, UserId, ExperienceStatus } from '../lib/types'

export interface LocalState {
  items: Experience[]
  profiles: Record<UserId, Profile>
  cover: string
  coverColor: string
  splashCover: string
  splashColor: string
  completions: Completion[]
}

const KEY = 'nl10'

const defaultProfiles: Record<UserId, Profile> = {
  E: { id: 'E', name: 'Evy', bio: 'Quero fazer algo diferente.', avatarUrl: null },
  J: { id: 'J', name: 'JP', bio: 'Qualquer lugar com comida boa.', avatarUrl: null },
}

function normalizeStatus(raw: unknown): ExperienceStatus {
  if (raw === 'Ideia' || raw === 'Planejado' || raw === 'Agendado' || raw === 'Vivido' || raw === 'Pausado' || raw === 'Arquivado') return raw
  if (raw === 'Já vivemos') return 'Vivido'
  if (raw === 'Em breve') return 'Planejado'
  return 'Ideia'
}

function fromStorage(raw: any): LocalState {
  const profiles: Record<UserId, Profile> = {
    E: { ...defaultProfiles.E },
    J: { ...defaultProfiles.J },
  }

  if (raw?.prof) {
    for (const id of ['E', 'J'] as const) {
      const p = raw.prof[id]
      if (p) profiles[id] = { id, name: p.n ?? profiles[id].name, bio: p.s ?? profiles[id].bio, avatarUrl: p.p || null }
    }
  }

  const items: Experience[] = Array.isArray(raw?.items)
    ? raw.items.map((i: any, index: number) => ({
        id: String(i.id ?? `i${Date.now()}-${index}`),
        title: i.title ?? i.t ?? 'Sem título',
        description: i.description ?? null,
        category: i.category ?? i.c ?? 'Comer',
        createdBy: (i.createdBy ?? i.by?.[0] ?? 'E') as UserId,
        createdAt: i.createdAt ?? new Date(i.at ?? Date.now()).toISOString(),
        updatedAt: i.updatedAt ?? new Date(i.at ?? Date.now()).toISOString(),
        updatedBy: (i.updatedBy ?? i.by?.[0] ?? null) as UserId | null,
        wantLevel: Math.min(5, Math.max(1, Number(i.wantLevel ?? i.want ?? 3))) as Experience['wantLevel'],
        importance: Math.min(3, Math.max(1, Number(i.importance ?? i.imp ?? 2))) as Experience['importance'],
        costMin: i.costMin ?? i.cmin ?? null,
        costMax: i.costMax ?? i.cmax ?? null,
        duration: i.duration ?? i.dur ?? null,
        location: i.location ?? i.l ?? null,
        externalUrl: i.externalUrl ?? null,
        reason: i.reason ?? null,
        status: normalizeStatus(i.status ?? i.w),
        plannedDate: i.plannedDate ?? null,
        scheduledDate: i.scheduledDate ?? null,
        notes: i.notes ?? null,
        imageUrl: i.imageUrl ?? i.p ?? null,
        lastViewedAt: i.seen ? new Date(i.seen).toISOString() : null,
      }))
    : []

  return {
    items,
    profiles,
    cover: raw?.cover ?? '',
    coverColor: raw?.ccolor ?? '',
    splashCover: raw?.splashCover ?? '',
    splashColor: raw?.splashColor ?? '#eaf0ff',
    completions: Array.isArray(raw?.completions) ? raw.completions.map((c: any) => ({ id: String(c.id), experienceId: String(c.experienceId), completedAt: c.completedAt, completedBy: (c.completedBy ?? 'E') as UserId, rating: c.rating ?? null, comment: c.comment ?? null, memory: c.memory ?? null })) : [],
  }
}

function toStorage(state: LocalState) {
  return {
    items: state.items.map(i => ({
      id: i.id,
      t: i.title,
      l: i.location ?? '',
      c: i.category,
      w: i.status === 'Vivido' ? 'Já vivemos' : i.status === 'Planejado' ? 'Em breve' : 'Sem data',
      by: [i.createdBy],
      p: i.imageUrl ?? '',
      want: i.wantLevel,
      imp: i.importance,
      cmin: i.costMin ?? '',
      cmax: i.costMax ?? '',
      dur: i.duration ?? '',
      at: new Date(i.createdAt).getTime(),
      seen: i.lastViewedAt ? new Date(i.lastViewedAt).getTime() : 0,
      status: i.status,
      createdBy: i.createdBy,
      updatedBy: i.updatedBy,
      updatedAt: i.updatedAt,
      plannedDate: i.plannedDate,
      scheduledDate: i.scheduledDate,
      reason: i.reason,
      description: i.description,
      notes: i.notes,
      externalUrl: i.externalUrl,
    })),
    prof: Object.fromEntries((Object.keys(state.profiles) as UserId[]).map(id => [id, {
      n: state.profiles[id].name,
      s: state.profiles[id].bio,
      p: state.profiles[id].avatarUrl ?? '',
    }])),
    cover: state.cover,
    ccolor: state.coverColor,
    splashCover: state.splashCover,
    splashColor: state.splashColor,
    completions: state.completions ?? [],
  }
}

export function loadLocalState(): LocalState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? fromStorage(JSON.parse(raw)) : fromStorage(null)
  } catch {
    return fromStorage(null)
  }
}

export function saveLocalState(state: LocalState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(toStorage(state)))
  } catch {
    // Local storage can reject very large base64 images. The UI remains usable.
  }
}

export function generateId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12,'0').slice(-12)}`
}
