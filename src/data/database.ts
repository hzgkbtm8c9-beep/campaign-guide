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

export interface CharacterAttribute {
  score: number | null
  modifier: number | null
}

export interface Character {
  id: string
  campaignId: string

  name: string
  ancestry: string
  characterClass: string

  level: number | null
  xp: number | null

  title: string
  alignment: string
  background: string
  deity: string

  strength: CharacterAttribute
  dexterity: CharacterAttribute
  constitution: CharacterAttribute
  intelligence: CharacterAttribute
  wisdom: CharacterAttribute
  charisma: CharacterAttribute

  currentHp: number | null
  maxHp: number | null
  armorClass: number | null

  attacks: string
  talentsAndSpells: string

  gear: string[]
  freeToCarry: string

  gp: number | null
  sp: number | null
  cp: number | null

  createdAt: string
  updatedAt: string
}

export type GoalTerm =
  | 'short'
  | 'mid'
  | 'long'

export type GoalStatus =
  | 'active'
  | 'completed'

export interface Goal {
  id: string
  campaignId: string

  title: string
  term: GoalTerm

  background: string
  goal: string
  howToMeasure: string
  downside: string

  hasSetback: boolean
  status: GoalStatus

  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  campaignId: string

  title: string
  todaySummary: string
  content: string

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
  notes: string
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

export interface ReviewDraftCategory {
  id: string
  reviewDraftId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ReviewDraftDiscovery {
  id: string
  reviewDraftId: string
  title: string
  categoryRef: string
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

export type NoteContributionTargetType =
  | 'person'
  | 'discovery'

export interface NoteContribution {
  id: string

  campaignId: string
  targetType: NoteContributionTargetType
  targetId: string

  sessionId?: string

  text: string

  createdAt: string
  updatedAt: string
}

class CampaignGuideDatabase extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>

  characters!: EntityTable<Character, 'id'>

  goals!: EntityTable<Goal, 'id'>

  reminders!: EntityTable<Reminder, 'id'>

  sessions!: EntityTable<Session, 'id'>

  quickNotes!: EntityTable<QuickNote, 'id'>

  people!: EntityTable<Person, 'id'>

  discoveryCategories!: EntityTable<
    DiscoveryCategory,
    'id'
  >

  discoveries!: EntityTable<
    Discovery,
    'id'
  >

  reviewDrafts!: EntityTable<
    ReviewDraft,
    'id'
  >

  reviewItems!: EntityTable<
    ReviewItem,
    'id'
  >

  reviewDraftPeople!: EntityTable<
    ReviewDraftPerson,
    'id'
  >

  reviewDraftCategories!: EntityTable<
    ReviewDraftCategory,
    'id'
  >

  reviewDraftDiscoveries!: EntityTable<
    ReviewDraftDiscovery,
    'id'
  >

  reviewDestinations!: EntityTable<
    ReviewDestination,
    'id'
  >

  noteContributions!: EntityTable<
    NoteContribution,
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
        'id, campaignId, sessionNumber, status, startedAt, retiredAt',
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

    this.version(9).stores({
      campaigns:
        'id, name, createdAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(10).stores({
      campaigns:
        'id, name, createdAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(11).stores({
      campaigns:
        'id, name, createdAt',

      characters:
        'id, campaignId, name, updatedAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(12).stores({
      campaigns:
        'id, name, createdAt',

      characters:
        'id, campaignId, name, updatedAt',

      goals:
        'id, campaignId, term, status, updatedAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

    this.version(13).stores({
      campaigns:
        'id, name, createdAt',

      characters:
        'id, campaignId, name, updatedAt',

      goals:
        'id, campaignId, term, status, hasSetback, updatedAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })
    .upgrade(async (transaction) => {
      await transaction
        .table('goals')
        .toCollection()
        .modify((goal) => {
          goal.background =
            goal.notes ?? ''

          goal.goal = ''
          goal.howToMeasure = ''
          goal.downside = ''
          goal.hasSetback = false

          delete goal.notes
        })
    })

    this.version(14).stores({
      campaigns:
        'id, name, createdAt',

      characters:
        'id, campaignId, name, updatedAt',

      goals:
        'id, campaignId, term, status, hasSetback, updatedAt',

      reminders:
        'id, campaignId, updatedAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',
    })

        this.version(15).stores({
      campaigns:
        'id, name, createdAt',

      characters:
        'id, campaignId, name, updatedAt',

      goals:
        'id, campaignId, term, status, hasSetback, updatedAt',

      reminders:
        'id, campaignId, updatedAt',

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

      reviewDraftCategories:
        'id, reviewDraftId, name, createdAt',

      reviewDraftDiscoveries:
        'id, reviewDraftId, title, categoryRef, createdAt',

      reviewDestinations:
        'id, reviewItemId, destinationType, targetId',

      noteContributions:
        'id, campaignId, targetType, targetId, sessionId, createdAt',
    })

    this.version(16)
      .stores({
        campaigns:
          'id, name, createdAt',

        characters:
          'id, campaignId, name, updatedAt',

        goals:
          'id, campaignId, term, status, hasSetback, updatedAt',

        reminders:
          'id, campaignId, updatedAt',

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

        reviewDraftCategories:
          'id, reviewDraftId, name, createdAt',

        reviewDraftDiscoveries:
          'id, reviewDraftId, title, categoryRef, createdAt',

        reviewDestinations:
          'id, reviewItemId, destinationType, targetId',

        noteContributions:
          'id, campaignId, targetType, targetId, sessionId, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('reminders')
          .toCollection()
          .modify((reminder) => {
            reminder.todaySummary = ''
          })
      })
  }
}

export const db =
  new CampaignGuideDatabase()