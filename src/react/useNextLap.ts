import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Experience, ExperienceStatus, UserId } from '../lib/types'
import { generateId, loadLocalState, saveLocalState, type LocalState } from './storage'
import { remoteAvailable, fetchRemoteSnapshot, getSession, resolveCurrentUser, insertExperience, updateExperience as updateRemoteExperience, deleteExperience as deleteRemoteExperience, insertCompletion, updateProfile, updateSettings, uploadPublicImage, signIn as remoteSignIn, signOut as remoteSignOut } from '../lib/remote'
import { supabase } from '../lib/supabase'

export const CATEGORIES = [
  ['Comer', 'fork'], ['Beber', 'glass'], ['Passear', 'leaf'], ['Cultura', 'mask'],
] as const

export const DURATIONS = [
  ['Até 1h', 'lt1h', 1], ['1–2h', '1-2h', 2], ['2–4h', '2-4h', 3], ['Meio período', 'half', 4], ['Dia inteiro', 'full', 5],
] as const

export const STATUSES: ExperienceStatus[] = ['Ideia', 'Planejado', 'Agendado', 'Vivido', 'Pausado', 'Arquivado']

export type ExperienceDraft = Omit<Experience, 'id'|'createdBy'|'createdAt'|'updatedAt'> & { id?: string }

function dataUrlToFile(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0))
  return new File([bytes], filename, { type: match[1] })
}

export function useNextLap() {
  const [data, setData] = useState<LocalState>(() => loadLocalState())
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<UserId | null>(remoteAvailable ? null : 'E')
  const [authLoading, setAuthLoading] = useState(remoteAvailable)
  const [authError, setAuthError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const replaceRemoteState = useCallback(async () => {
    if (!remoteAvailable) return
    setSyncing(true)
    try {
      const snapshot = await fetchRemoteSnapshot()
      const next: LocalState = {
        items: snapshot.items,
        profiles: snapshot.profiles,
        cover: snapshot.cover,
        coverColor: snapshot.coverColor,
        splashCover: snapshot.splashCover,
        splashColor: snapshot.splashColor,
        completions: snapshot.completions,
      }
      setData(next)
      saveLocalState(next)
      setCurrentUser(snapshot.currentUser)
      setSyncError('')
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Não foi possível sincronizar.')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    let active = true
    const boot = async () => {
      setAuthLoading(true)
      try {
        const s = await getSession()
        if (!active) return
        setSession(s)
        if (s) await replaceRemoteState()
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : 'Não foi possível iniciar a sessão.')
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    void boot()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAuthError('')
      if (nextSession) setTimeout(() => void replaceRemoteState(), 0)
      else setCurrentUser(null)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [replaceRemoteState])

  useEffect(() => {
  const client = supabase
  if (!client || !session || !currentUser) return

  const channel = client
    .channel('next-lap-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'experiences' }, () => { void replaceRemoteState() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { void replaceRemoteState() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, () => { void replaceRemoteState() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => { void replaceRemoteState() })
    .subscribe()

  return () => { void client.removeChannel(channel) }
}, [session, currentUser, replaceRemoteState])

  const persistLocal = useCallback((updater: (current: LocalState) => LocalState) => {
    setData(current => {
      const next = updater(current)
      saveLocalState(next)
      return next
    })
  }, [])

  const addExperience = useCallback(async (draft: ExperienceDraft, explicitUser?: UserId) => {
    const user = explicitUser ?? currentUser ?? 'E'
    const now = new Date().toISOString()
    let finalImage = draft.imageUrl ?? null
    if (remoteAvailable && finalImage?.startsWith('data:')) {
      const file = dataUrlToFile(finalImage, 'experience.jpg')
      if (file) finalImage = await uploadPublicImage('experiences', file, user)
    }
    const item: Experience = { ...draft, id: draft.id ?? generateId(), imageUrl: finalImage, createdBy: user, createdAt: now, updatedAt: now, updatedBy: user }
    persistLocal(current => ({ ...current, items: [item, ...current.items] }))
    if (remoteAvailable && session) {
      try { await insertExperience(item, user); setSyncError('') }
      catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao salvar no Supabase.'); void replaceRemoteState() }
    }
  }, [currentUser, persistLocal, remoteAvailable, replaceRemoteState, session])

  const updateExperience = useCallback(async (id: string, patch: Partial<Experience>, explicitUser?: UserId) => {
    const user = explicitUser ?? currentUser ?? 'E'
    const finalPatch = { ...patch, updatedBy: user, updatedAt: new Date().toISOString() }
    persistLocal(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...finalPatch } : item) }))
    if (remoteAvailable && session) {
      try { await updateRemoteExperience(id, finalPatch, user); setSyncError('') }
      catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao atualizar no Supabase.'); void replaceRemoteState() }
    }
  }, [currentUser, persistLocal, replaceRemoteState, session])

  const markViewed = useCallback(async (id: string, explicitUser?: UserId) => {
    const user = explicitUser ?? currentUser ?? 'E'
    const now = new Date().toISOString()
    persistLocal(current => ({
      ...current,
      items: current.items.map(item => item.id === id ? { ...item, status: 'Vivido', lastViewedAt: now, updatedAt: now, updatedBy: user } : item),
      completions: [...(current.completions ?? []), { id: generateId(), experienceId: id, completedAt: now, completedBy: user }],
    }))
    if (remoteAvailable && session) {
      try {
        await insertCompletion(id, user)
        await updateRemoteExperience(id, { status: 'Vivido', lastViewedAt: now, updatedAt: now, updatedBy: user }, user)
        setSyncError('')
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Falha ao registrar a vivência.'); void replaceRemoteState()
      }
    }
  }, [currentUser, persistLocal, replaceRemoteState, session])

  const deleteExperience = useCallback(async (id: string) => {
    persistLocal(current => ({ ...current, items: current.items.filter(item => item.id !== id), completions: (current.completions ?? []).filter(c => c.experienceId !== id) }))
    if (remoteAvailable && session) {
      try { await deleteRemoteExperience(id); setSyncError('') }
      catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao excluir.'); void replaceRemoteState() }
    }
  }, [persistLocal, replaceRemoteState, session])

  const selectPhoto = useCallback(async (target: 'experience'|'profile'|'home'|'splash', value: string, id?: string) => {
    const user = currentUser ?? 'E'
    let remoteValue = value
    if (remoteAvailable && value.startsWith('data:')) {
      const file = dataUrlToFile(value, `${target}.jpg`)
      if (file) {
        const bucket = target === 'profile' ? 'avatars' : target === 'experience' ? 'experiences' : 'backgrounds'
        remoteValue = await uploadPublicImage(bucket, file, target === 'profile' && id ? id : user)
      }
    }
    persistLocal(current => {
      if (target === 'home') return { ...current, cover: remoteValue, coverColor: '' }
      if (target === 'splash') return { ...current, splashCover: remoteValue, splashColor: '' }
      if (target === 'profile' && id) {
        const profileId = id as UserId
        return { ...current, profiles: { ...current.profiles, [profileId]: { ...current.profiles[profileId], avatarUrl: remoteValue } } }
      }
      if (target === 'experience' && id) return { ...current, items: current.items.map(i => i.id === id ? { ...i, imageUrl: remoteValue, updatedAt: new Date().toISOString(), updatedBy: user } : i) }
      return current
    })
    try {
      if (remoteAvailable && session) {
        if (target === 'profile' && id) await updateProfile(id as UserId, { avatarUrl: remoteValue })
        else if (target === 'experience' && id) await updateRemoteExperience(id, { imageUrl: remoteValue, updatedAt: new Date().toISOString(), updatedBy: user }, user)
        else await updateSettings(user, { cover: target === 'home' ? remoteValue : data.cover, coverColor: target === 'home' ? '' : data.coverColor, splashCover: target === 'splash' ? remoteValue : data.splashCover, splashColor: target === 'splash' ? '' : data.splashColor })
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Falha ao salvar a imagem.')
      void replaceRemoteState()
    }
  }, [currentUser, data.cover, data.coverColor, data.splashCover, data.splashColor, persistLocal, replaceRemoteState, session])

  const setBackgroundColor = useCallback(async (target: 'home'|'splash', value: string) => {
    const next = target === 'home'
      ? { cover: '', coverColor: value, splashCover: data.splashCover, splashColor: data.splashColor }
      : { cover: data.cover, coverColor: data.coverColor, splashCover: '', splashColor: value }
    persistLocal(current => ({ ...current, ...next }))
    if (remoteAvailable && session) {
      try { await updateSettings(currentUser ?? 'E', next); setSyncError('') }
      catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao salvar a aparência.'); void replaceRemoteState() }
    }
  }, [currentUser, data.cover, data.coverColor, data.splashCover, data.splashColor, persistLocal, replaceRemoteState, session])

  const setProfileBio = useCallback(async (id: UserId, bio: string) => {
    persistLocal(current => ({ ...current, profiles: { ...current.profiles, [id]: { ...current.profiles[id], bio } } }))
    if (remoteAvailable && session) {
      try { await updateProfile(id, { bio }); setSyncError('') }
      catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao salvar o perfil.'); void replaceRemoteState() }
    }
  }, [persistLocal, replaceRemoteState, session])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError('')
    const { error } = await remoteSignIn(email, password)
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    await remoteSignOut()
    setSession(null)
    setCurrentUser(null)
  }, [])

  const daysSince = useCallback((iso?: string | null) => {
    if (!iso) return 999
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  }, [])

  const forgotten = useMemo(() => data.items.filter(i => i.status === 'Ideia' && daysSince(i.lastViewedAt || i.updatedAt) >= 30), [data.items, daysSince])

  return {
    data,
    currentUser,
    session,
    remoteEnabled: remoteAvailable,
    authenticated: !remoteAvailable || Boolean(session && currentUser),
    authLoading,
    authError,
    syncing,
    syncError,
    addExperience,
    updateExperience,
    markViewed,
    deleteExperience,
    selectPhoto,
    setBackgroundColor,
    setProfileBio,
    daysSince,
    forgotten,
    signIn,
    signOut,
    refresh: replaceRemoteState,
    resolveCurrentUser,
  }
}
