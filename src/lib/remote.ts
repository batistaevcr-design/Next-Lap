import { supabase } from './supabase'
import type { Completion, Experience, Profile, UserId } from './types'
import type { LocalState } from '../react/storage'

const enabled = Boolean(supabase)

function rowToExperience(row: any): Experience {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    category: row.category,
    createdBy: row.created_by as UserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: (row.updated_by ?? null) as UserId | null,
    wantLevel: row.want_level,
    importance: row.importance,
    costMin: row.cost_min,
    costMax: row.cost_max,
    duration: row.duration,
    location: row.location,
    externalUrl: row.external_url,
    reason: row.reason,
    status: row.status,
    plannedDate: row.planned_date,
    scheduledDate: row.scheduled_date,
    notes: row.notes,
    imageUrl: row.image_url,
    lastViewedAt: row.last_viewed_at,
  }
}

function experienceToRow(item: Experience) {
  return {
    title: item.title,
    description: item.description ?? null,
    category: item.category,
    want_level: item.wantLevel,
    importance: item.importance,
    cost_min: item.costMin ?? null,
    cost_max: item.costMax ?? null,
    duration: item.duration ?? null,
    location: item.location ?? null,
    external_url: item.externalUrl ?? null,
    reason: item.reason ?? null,
    status: item.status,
    planned_date: item.plannedDate ?? null,
    scheduled_date: item.scheduledDate ?? null,
    notes: item.notes ?? null,
    image_url: item.imageUrl ?? null,
    last_viewed_at: item.lastViewedAt ?? null,
  }
}

export interface RemoteSnapshot extends LocalState {
  completions: Completion[]
  currentUser: UserId
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function resolveCurrentUser(): Promise<UserId | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle()
  if (error) throw error
  return (data?.id as UserId | undefined) ?? null
}

export async function fetchRemoteSnapshot(): Promise<RemoteSnapshot> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const [profilesRes, experiencesRes, completionsRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('id,name,bio,avatar_url').order('id'),
    supabase.from('experiences').select('*').order('created_at', { ascending: false }),
    supabase.from('completions').select('*').order('completed_at', { ascending: false }),
    supabase.from('app_settings').select('*').eq('id', true).maybeSingle(),
  ])
  for (const result of [profilesRes, experiencesRes, completionsRes, settingsRes]) if (result.error) throw result.error

  const profiles: Record<UserId, Profile> = {
    E: { id: 'E', name: 'Evy', bio: 'Quero fazer algo diferente.', avatarUrl: null },
    J: { id: 'J', name: 'JP', bio: 'Qualquer lugar com comida boa.', avatarUrl: null },
  }
  for (const row of profilesRes.data ?? []) {
    if (row.id === 'E' || row.id === 'J') {
      const code = row.id as UserId
      profiles[code] = { id: code, name: row.name, bio: row.bio ?? '', avatarUrl: row.avatar_url ?? null }
    }
  }

  const settings = settingsRes.data
  const currentUser = await resolveCurrentUser()
  if (!currentUser) throw new Error('O usuário autenticado ainda não está vinculado ao perfil E ou J.')

  return {
    items: (experiencesRes.data ?? []).map(rowToExperience),
    profiles,
    cover: settings?.cover_url ?? '',
    coverColor: settings?.cover_color ?? '',
    splashCover: settings?.splash_cover_url ?? '',
    splashColor: settings?.splash_color ?? '#eaf0ff',
    completions: (completionsRes.data ?? []).map((row: any) => ({
      id: row.id,
      experienceId: row.experience_id,
      completedAt: row.completed_at,
      completedBy: row.completed_by as UserId,
      rating: row.rating,
      comment: row.comment,
      memory: row.memory,
    })),
    currentUser,
  }
}

export async function insertExperience(item: Experience, currentUser: UserId) {
  if (!supabase) return
  const { error } = await supabase.from('experiences').insert({
    id: item.id,
    ...experienceToRow(item),
    created_by: currentUser,
    updated_by: currentUser,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  })
  if (error) throw error
}

export async function updateExperience(id: string, patch: Partial<Experience>, currentUser: UserId) {
  if (!supabase) return
  const partial: Record<string, unknown> = { updated_by: currentUser }
  const mapping: Record<string, string> = {
    title:'title', description:'description', category:'category', wantLevel:'want_level', importance:'importance', costMin:'cost_min', costMax:'cost_max',
    duration:'duration', location:'location', externalUrl:'external_url', reason:'reason', status:'status', plannedDate:'planned_date', scheduledDate:'scheduled_date', notes:'notes', imageUrl:'image_url', lastViewedAt:'last_viewed_at', updatedAt:'updated_at'
  }
  for (const [key, value] of Object.entries(patch)) if (mapping[key]) partial[mapping[key]] = value ?? null
  const { error } = await supabase.from('experiences').update(partial).eq('id', id)
  if (error) throw error
}

export async function deleteExperience(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('experiences').delete().eq('id', id)
  if (error) throw error
}

export async function insertCompletion(experienceId: string, completedBy: UserId) {
  if (!supabase) return
  const { error } = await supabase.from('completions').insert({ experience_id: experienceId, completed_by: completedBy })
  if (error) throw error
}

export async function updateProfile(id: UserId, patch: Partial<Profile>) {
  if (!supabase) return
  const { error } = await supabase.from('profiles').update({ name: patch.name, bio: patch.bio, avatar_url: patch.avatarUrl }).eq('id', id)
  if (error) throw error
}

export async function updateSettings(currentUser: UserId, patch: Pick<LocalState,'cover'|'coverColor'|'splashCover'|'splashColor'>) {
  if (!supabase) return
  const { error } = await supabase.from('app_settings').upsert({
    id: true,
    cover_url: patch.cover,
    cover_color: patch.coverColor,
    splash_cover_url: patch.splashCover,
    splash_color: patch.splashColor,
    updated_by: currentUser,
  })
  if (error) throw error
}

export async function uploadPublicImage(bucket: 'avatars'|'experiences'|'backgrounds', file: File, owner: string) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const path = `${owner}/${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, cacheControl: '31536000', contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export const remoteAvailable = enabled
