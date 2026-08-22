import Dexie, { type EntityTable } from 'dexie'

export type SessionStatus =
  | 'active'
  | 'awaiting_review'
  | 'reviewing'
  | 'completed'

export type ReviewDestinationType =
  | 'journal'
  | 'person'
  | 'discovery'

export interface Campaign {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  campaignId: string
  sessionNumber: number
  status: SessionStatus
  startedAt: string
  endedAt?: string
  reviewCompletedAt?: string
  title: string
  journalText: string
  retiredAt?: string
  createdAt: string
  updatedAt: string
}

export interface QuickNote {
  id: string
  campaignId: string
  sessionId: string
  text: string
  capturedAt: string
  createdAt: string
  updatedAt: string
}

export interface Person {
  id: string
  campaignId: string
  name: string
  description: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface DiscoveryCategory {
  id: string
  campaignId: string
  name: string
  sortPosition: number
  createdAt: string
  updatedAt: string
}

export interface Discovery {
  id: string
  campaignId: string
  title: string
  categoryId: string
  discoveredInSessionId?: string
  createdAt: string
  updatedAt: string
}

export interface ReviewDraft {
  id: string
  campaignId: string
  sessionId: string
  status: 'in_progress' | 'completed'
  currentReviewItemId?: string
  createdAt: string
  updatedAt: string
}

export interface ReviewItem {
  id: string
  reviewDraftId: string
  quickNoteId: string
  workingText: string
  isDiscarded: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewDraftPerson {
  id: string
  reviewDraftId: string
  name: string
  role?: string
  createdAt: string
  updatedAt: string
}

export interface ReviewDestination {
  id: string
  reviewItemId: string
  destinationType: ReviewDestinationType
  targetId?: string
  text: string
  createdAt: string
  updatedAt: string
}

class CampaignGuideDatabase extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>
  sessions!: EntityTable<Session, 'id'>
  quickNotes!: EntityTable<QuickNote, 'id'>
  people!: EntityTable<Person, 'id'>
  discoveryCategories!: EntityTable<
    DiscoveryCategory,
    'id'
  >
  discoveries!: EntityTable<Discovery, 'id'>
  reviewDrafts!: EntityTable<ReviewDraft, 'id'>
  reviewItems!: EntityTable<ReviewItem, 'id'>
  reviewDraftPeople!: EntityTable<
    ReviewDraftPerson,
    'id'
  >
  reviewDestinations!: EntityTable<
    ReviewDestination,
    'id'
  >

  constructor() {
    super('campaign-guide')

    this.version(1).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
    })

    this.version(2).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
    })

    this.version(3).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionId, status, currentReviewItemId',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
    })

    this.version(4).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
      reviewActions:
        'id, reviewDraftId, reviewItemId, type',
    })

    this.version(5).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
      reviewActions: null,
      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(6).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      people:
        'id, campaignId, name, createdAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(7).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      people:
        'id, campaignId, name, createdAt',
      discoveryCategories:
        'id, campaignId, name, sortPosition',
      discoveries:
        'id, campaignId, title, categoryId, discoveredInSessionId, createdAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(8).stores({
      campaigns: 'id, name, createdAt',
      sessions:
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
      quickNotes:
        'id, campaignId, sessionId, capturedAt',
      people:
        'id, campaignId, name, createdAt',
      discoveryCategories:
        'id, campaignId, name, sortPosition',
      discoveries:
        'id, campaignId, title, categoryId, discoveredInSessionId, createdAt',
      reviewDrafts:
        'id, campaignId, sessionId, status, currentReviewItemId',
      reviewItems:
        'id, reviewDraftId, quickNoteId',
      reviewDraftPeople:
        'id, reviewDraftId, name, createdAt',
      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })
  }
}

export const db = new CampaignGuideDatabase()