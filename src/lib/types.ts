export type UserId = 'E' | 'J'

export type ExperienceStatus =
  | 'Ideia'
  | 'Planejado'
  | 'Agendado'
  | 'Vivido'
  | 'Pausado'
  | 'Arquivado'

export interface Profile {
  id: UserId
  name: string
  bio: string
  avatarUrl: string | null
}

export interface Experience {
  id: string
  title: string
  description?: string | null
  category: string
  createdBy: UserId
  createdAt: string
  updatedAt: string
  updatedBy?: UserId | null
  wantLevel: 1 | 2 | 3 | 4 | 5
  importance: 1 | 2 | 3
  costMin?: number | null
  costMax?: number | null
  duration?: string | null
  location?: string | null
  externalUrl?: string | null
  reason?: string | null
  status: ExperienceStatus
  plannedDate?: string | null
  scheduledDate?: string | null
  notes?: string | null
  imageUrl?: string | null
  lastViewedAt?: string | null
}

export interface Completion {
  id: string
  experienceId: string
  completedAt: string
  completedBy: UserId
  rating?: number | null
  comment?: string | null
  memory?: string | null
}
