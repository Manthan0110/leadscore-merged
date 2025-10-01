export type LeadPayload = {
  firstName?: string
  lastName?: string
  email: string
  company?: string
  jobTitle?: string
  companySize?: string
  source?: string
  pagesVisited?: number
  interaction?: 'Low' | 'Medium' | 'High'
  notes?: string
  utm_source?: string
}

export type ScoreResponse = {
  score: number
  reasons?: { feature: string; contribution: number }[]
  id?: string
  error?: string
}

export type Lead = {
  id: string
  firstName?: string
  lastName?: string
  email: string
  company?: string
  jobTitle?: string
  companySize?: string
  source?: string
  pagesVisited?: number
  interaction?: 'Low' | 'Medium' | 'High'
  score: number
  reasons?: any
  createdAt: string
}
