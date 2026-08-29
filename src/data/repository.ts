import { db, type Campaign } from './database'

function createId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const random =
        Math.floor(
          Math.random() * 16
        )

      const value =
        character === 'x'
          ? random
          : (random & 0x3) | 0x8

      return value.toString(16)
    }
  )
}

function nowIso() {
  return new Date().toISOString()
}

export async function getCampaigns(): Promise<
  Campaign[]
> {
  const campaigns =
    await db.campaigns.toArray()

  return campaigns.sort(
    (a, b) =>
      a.createdAt.localeCompare(
        b.createdAt
      )
  )
}

export async function createCampaign(
  name: string
): Promise<Campaign> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error('Campaign name is required.')
  }

  const timestamp = nowIso()

  const campaign: Campaign = {
    id: createId(),
    name: trimmedName,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.campaigns.add(campaign)

  return campaign
}

export async function getActiveSession(
  campaignId: string
) {
  return db.sessions
    .where('campaignId')
    .equals(campaignId)
    .filter(
      (session) =>
        session.status === 'active'
    )
    .first()
}

export async function startSession(
  campaignId: string
) {
  return db.transaction(
    'rw',
    db.sessions,
    async () => {
      const existingActiveSession =
        await getActiveSession(campaignId)

      if (existingActiveSession) {
        throw new Error(
          'A session is already active.'
        )
      }

      const existingSessions =
        await db.sessions
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      const highestSessionNumber =
        existingSessions.reduce(
          (highest, session) =>
            Math.max(
              highest,
              session.sessionNumber
            ),
          0
        )

      const timestamp =
        new Date().toISOString()

      const session = {
        id: createId(),
        campaignId,
        sessionNumber:
          highestSessionNumber + 1,
        status: 'active' as const,
        startedAt: timestamp,
        title: '',
        journalText: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await db.sessions.add(session)

      return session
    }
  )
}

export async function createQuickNote(
  campaignId: string,
  sessionId: string,
  text: string
) {
  const trimmedText = text.trim()

  if (!trimmedText) {
    throw new Error(
      'Quick Note text is required.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const quickNote = {
    id: createId(),
    campaignId,
    sessionId,
    text: trimmedText,
    capturedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.quickNotes.add(quickNote)

  return quickNote
}

export async function getQuickNotesForSession(
  sessionId: string
) {
  return db.quickNotes
    .where('sessionId')
    .equals(sessionId)
    .sortBy('capturedAt')
}

export async function endSession(
  sessionId: string
) {
  const session =
    await db.sessions.get(sessionId)

  if (!session) {
    throw new Error('Session not found.')
  }

  if (session.status !== 'active') {
    throw new Error(
      'Only an active session can be ended.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.sessions.update(sessionId, {
    status: 'awaiting_review',
    endedAt: timestamp,
    updatedAt: timestamp,
  })

  return db.sessions.get(sessionId)
}

export async function getOpenReviews(
  campaignId: string
) {
  const sessions =
    await db.sessions
      .where('campaignId')
      .equals(campaignId)
      .filter(
        (session) =>
          session.status ===
            'awaiting_review' ||
          session.status === 'reviewing'
      )
      .toArray()

  return sessions.sort(
    (a, b) =>
      new Date(
        a.endedAt ?? a.createdAt
      ).getTime() -
      new Date(
        b.endedAt ?? b.createdAt
      ).getTime()
  )
}

export async function getReviewDraftForSession(
  sessionId: string
) {
  return db.reviewDrafts
    .where('sessionId')
    .equals(sessionId)
    .first()
}

export async function getReviewItems(
  reviewDraftId: string
) {
  const reviewDraft =
    await db.reviewDrafts.get(
      reviewDraftId
    )

  if (!reviewDraft) {
    return []
  }

  const [
    reviewItems,
    quickNotes,
  ] = await Promise.all([
    db.reviewItems
      .where('reviewDraftId')
      .equals(reviewDraftId)
      .toArray(),

    getQuickNotesForSession(
      reviewDraft.sessionId
    ),
  ])

  const noteOrder = new Map(
    quickNotes.map(
      (quickNote, index) => [
        quickNote.id,
        index,
      ]
    )
  )

  return reviewItems.sort(
    (a, b) =>
      (noteOrder.get(a.quickNoteId) ??
        Number.MAX_SAFE_INTEGER) -
      (noteOrder.get(b.quickNoteId) ??
        Number.MAX_SAFE_INTEGER)
  )
}

export async function startOrResumeReview(
  sessionId: string
) {
  return db.transaction(
    'rw',
    db.sessions,
    db.quickNotes,
    db.reviewDrafts,
    db.reviewItems,
    async () => {
      const session =
        await db.sessions.get(sessionId)

      if (!session) {
        throw new Error(
          'Session not found.'
        )
      }

      if (
        session.status !==
          'awaiting_review' &&
        session.status !== 'reviewing'
      ) {
        throw new Error(
          'Only an open review can be started or resumed.'
        )
      }

      let reviewDraft =
        await getReviewDraftForSession(
          sessionId
        )

      if (!reviewDraft) {
        const timestamp =
          new Date().toISOString()

        const quickNotes =
          await getQuickNotesForSession(
            sessionId
          )

        reviewDraft = {
          id: createId(),
          campaignId:
            session.campaignId,
          sessionId: session.id,
          status:
            'in_progress' as const,
          currentReviewItemId:
            undefined,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        await db.reviewDrafts.add(
          reviewDraft
        )

        const reviewItems =
          quickNotes.map(
            (quickNote) => ({
              id: createId(),
              reviewDraftId:
                reviewDraft!.id,
              quickNoteId:
                quickNote.id,
              workingText:
                quickNote.text,
              isDiscarded: false,
              createdAt: timestamp,
              updatedAt: timestamp,
            })
          )

        if (
          reviewItems.length > 0
        ) {
          await db.reviewItems.bulkAdd(
            reviewItems
          )

          reviewDraft.currentReviewItemId =
            reviewItems[0].id

          await db.reviewDrafts.update(
            reviewDraft.id,
            {
              currentReviewItemId:
                reviewItems[0].id,
              updatedAt: timestamp,
            }
          )
        }

        await db.sessions.update(
          session.id,
          {
            status: 'reviewing',
            updatedAt: timestamp,
          }
        )
      }

      const reviewItems =
        await getReviewItems(
          reviewDraft.id
        )

      return {
        reviewDraft,
        reviewItems,
      }
    }
  )
}

export async function updateReviewItemText(
  reviewItemId: string,
  workingText: string
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.reviewItems.update(
    reviewItemId,
    {
      workingText,
      updatedAt: timestamp,
    }
  )

  return db.reviewItems.get(
    reviewItemId
  )
}

export async function setCurrentReviewItem(
  reviewDraftId: string,
  reviewItemId: string
) {
  const reviewDraft =
    await db.reviewDrafts.get(
      reviewDraftId
    )

  if (!reviewDraft) {
    throw new Error(
      'Review draft not found.'
    )
  }

  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  if (
    reviewItem.reviewDraftId !==
    reviewDraftId
  ) {
    throw new Error(
      'Review item does not belong to this review.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.reviewDrafts.update(
    reviewDraftId,
    {
      currentReviewItemId:
        reviewItemId,
      updatedAt: timestamp,
    }
  )
}

export async function getReviewDestinations(
  reviewItemId: string
) {
  return db.reviewDestinations
    .where('reviewItemId')
    .equals(reviewItemId)
    .toArray()
}

export async function addJournalDestination(
  reviewItemId: string,
  initialText: string
) {
  const existing =
    await db.reviewDestinations
      .where('reviewItemId')
      .equals(reviewItemId)
      .filter(
        (destination) =>
          destination.destinationType ===
          'journal'
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp =
    new Date().toISOString()

  const destination = {
    id: createId(),
    reviewItemId,
    destinationType:
      'journal' as const,
    targetId: undefined,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(
    destination
  )

  return destination
}

export async function updateReviewDestinationText(
  destinationId: string,
  text: string
) {
  const destination =
    await db.reviewDestinations.get(
      destinationId
    )

  if (!destination) {
    throw new Error(
      'Review destination not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.reviewDestinations.update(
    destinationId,
    {
      text,
      updatedAt: timestamp,
    }
  )

  return db.reviewDestinations.get(
    destinationId
  )
}

export async function removeReviewDestination(
  destinationId: string
) {
  const destination =
    await db.reviewDestinations.get(
      destinationId
    )

  if (!destination) {
    return
  }

  await db.reviewDestinations.delete(
    destinationId
  )
}

/*
 * PERMANENT PEOPLE
 */

export async function createPerson(
  campaignId: string,
  name: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Person name is required.'
    )
  }

  const campaign =
    await db.campaigns.get(
      campaignId
    )

  if (!campaign) {
    throw new Error(
      'Campaign not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const person = {
    id: createId(),
    campaignId,
    name: trimmedName,
    description: '',
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.people.add(person)

  return person
}

export async function getPeople(
  campaignId: string
) {
  return db.people
    .where('campaignId')
    .equals(campaignId)
    .sortBy('name')
}

export async function getPerson(
  personId: string
) {
  return db.people.get(personId)
}

export async function addPersonDestination(
  reviewItemId: string,
  personId: string,
  initialText: string
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const person =
    await db.people.get(personId)

  if (!person) {
    throw new Error(
      'Person not found.'
    )
  }

  const existing =
    await db.reviewDestinations
      .where('reviewItemId')
      .equals(reviewItemId)
      .filter(
        (destination) =>
          destination.destinationType ===
            'person' &&
          destination.targetId ===
            personId
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp =
    new Date().toISOString()

  const destination = {
    id: createId(),
    reviewItemId,
    destinationType:
      'person' as const,
    targetId: personId,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(
    destination
  )

  return destination
}

/*
 * REVIEW-DRAFT PEOPLE
 */

export async function getReviewDraftPeople(
  reviewDraftId: string
) {
  return db.reviewDraftPeople
    .where('reviewDraftId')
    .equals(reviewDraftId)
    .sortBy('name')
}

export async function addReviewDraftPersonDestination(
  reviewItemId: string,
  draftPersonId: string,
  initialText: string
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const draftPerson =
    await db.reviewDraftPeople.get(
      draftPersonId
    )

  if (!draftPerson) {
    throw new Error(
      'Review draft Person not found.'
    )
  }

  if (
    draftPerson.reviewDraftId !==
    reviewItem.reviewDraftId
  ) {
    throw new Error(
      'Draft Person belongs to another Review.'
    )
  }

  const existing =
    await db.reviewDestinations
      .where('reviewItemId')
      .equals(reviewItemId)
      .filter(
        (destination) =>
          destination.destinationType ===
            'person' &&
          destination.targetId ===
            draftPersonId
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp =
    new Date().toISOString()

  const destination = {
    id: createId(),
    reviewItemId,
    destinationType:
      'person' as const,
    targetId: draftPersonId,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(
    destination
  )

  return destination
}

export async function createReviewDraftPersonAndDestination(
  reviewDraftId: string,
  reviewItemId: string,
  name: string,
  initialText: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Person name is required.'
    )
  }

  return db.transaction(
    'rw',
    db.reviewDrafts,
    db.reviewItems,
    db.reviewDraftPeople,
    db.reviewDestinations,
    async () => {
      const reviewDraft =
        await db.reviewDrafts.get(
          reviewDraftId
        )

      if (!reviewDraft) {
        throw new Error(
          'Review draft not found.'
        )
      }

      const reviewItem =
        await db.reviewItems.get(
          reviewItemId
        )

      if (!reviewItem) {
        throw new Error(
          'Review item not found.'
        )
      }

      if (
        reviewItem.reviewDraftId !==
        reviewDraft.id
      ) {
        throw new Error(
          'Review item does not belong to this Review.'
        )
      }

      const timestamp =
        new Date().toISOString()

      const draftPerson = {
        id: createId(),
        reviewDraftId,
        name: trimmedName,
        role: undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await db.reviewDraftPeople.add(
        draftPerson
      )

      const destination = {
        id: createId(),
        reviewItemId,
        destinationType:
          'person' as const,
        targetId: draftPerson.id,
        text: initialText,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await db.reviewDestinations.add(
        destination
      )

      return {
        draftPerson,
        destination,
      }
    }
  )
}/*
 * DISCOVERY CATEGORIES
 */

const DEFAULT_DISCOVERY_CATEGORIES = [
  'Location',
  'Item',
  'Group',
  'Creature',
  'Clue',
] as const

export async function ensureDefaultDiscoveryCategories(
  campaignId: string
) {
  const existingCategories =
    await db.discoveryCategories
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  if (existingCategories.length > 0) {
    return existingCategories.sort(
      (a, b) =>
        a.sortPosition - b.sortPosition
    )
  }

  const campaign =
    await db.campaigns.get(campaignId)

  if (!campaign) {
    throw new Error(
      'Campaign not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const categories =
    DEFAULT_DISCOVERY_CATEGORIES.map(
      (name, index) => ({
        id: createId(),
        campaignId,
        name,
        sortPosition: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    )

  await db.discoveryCategories.bulkAdd(
    categories
  )

  return categories
}

export async function getDiscoveryCategories(
  campaignId: string
) {
  const categories =
    await ensureDefaultDiscoveryCategories(
      campaignId
    )

  return categories.sort(
    (a, b) =>
      a.sortPosition - b.sortPosition
  )
}

/*
 * DISCOVERIES
 */

export async function getDiscoveries(
  campaignId: string
) {
  return db.discoveries
    .where('campaignId')
    .equals(campaignId)
    .sortBy('title')
}

export async function getDiscovery(
  discoveryId: string
) {
  return db.discoveries.get(
    discoveryId
  )
}

export async function getReviewDraftCategories(
  reviewDraftId: string
) {
  return db.reviewDraftCategories
    .where('reviewDraftId')
    .equals(reviewDraftId)
    .sortBy('name')
}

export async function getReviewDraftDiscoveries(
  reviewDraftId: string
) {
  return db.reviewDraftDiscoveries
    .where('reviewDraftId')
    .equals(reviewDraftId)
    .sortBy('title')
}

export async function addDiscoveryDestination(
  reviewItemId: string,
  discoveryId: string,
  initialText: string
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const discovery =
    await db.discoveries.get(
      discoveryId
    )

  if (!discovery) {
    throw new Error(
      'Discovery not found.'
    )
  }

  const existing =
    await db.reviewDestinations
      .where('reviewItemId')
      .equals(reviewItemId)
      .filter(
        (destination) =>
          destination.destinationType ===
            'discovery' &&
          destination.targetId ===
            discoveryId
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp =
    new Date().toISOString()

  const destination = {
    id: createId(),
    reviewItemId,
    destinationType:
      'discovery' as const,
    targetId: discoveryId,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(
    destination
  )

  return destination
}

export async function addReviewDraftDiscoveryDestination(
  reviewItemId: string,
  draftDiscoveryId: string,
  initialText: string
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const draftDiscovery =
    await db.reviewDraftDiscoveries.get(
      draftDiscoveryId
    )

  if (!draftDiscovery) {
    throw new Error(
      'Review draft Discovery not found.'
    )
  }

  if (
    draftDiscovery.reviewDraftId !==
    reviewItem.reviewDraftId
  ) {
    throw new Error(
      'Draft Discovery belongs to another Review.'
    )
  }

  const existing =
    await db.reviewDestinations
      .where('reviewItemId')
      .equals(reviewItemId)
      .filter(
        (destination) =>
          destination.destinationType ===
            'discovery' &&
          destination.targetId ===
            draftDiscoveryId
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp =
    new Date().toISOString()

  const destination = {
    id: createId(),
    reviewItemId,
    destinationType:
      'discovery' as const,
    targetId: draftDiscoveryId,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(
    destination
  )

  return destination
}

export async function createReviewDraftCategory(
  reviewDraftId: string,
  name: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Category name is required.'
    )
  }

  const reviewDraft =
    await db.reviewDrafts.get(
      reviewDraftId
    )

  if (!reviewDraft) {
    throw new Error(
      'Review draft not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const draftCategory = {
    id: createId(),
    reviewDraftId,
    name: trimmedName,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDraftCategories.add(
    draftCategory
  )

  return draftCategory
}

export async function createReviewDraftDiscoveryAndDestination(
  reviewDraftId: string,
  reviewItemId: string,
  title: string,
  categoryRef: string,
  initialText: string
) {
  const trimmedTitle =
    title.trim()

  if (!trimmedTitle) {
    throw new Error(
      'Discovery title is required.'
    )
  }

  if (!categoryRef) {
    throw new Error(
      'Discovery category is required.'
    )
  }

  return db.transaction(
  'rw',
  [
    db.reviewDrafts,
    db.reviewItems,
    db.discoveryCategories,
    db.reviewDraftCategories,
    db.reviewDraftDiscoveries,
    db.reviewDestinations,
  ],
  async () => {
      const reviewDraft =
        await db.reviewDrafts.get(
          reviewDraftId
        )

      if (!reviewDraft) {
        throw new Error(
          'Review draft not found.'
        )
      }

      const reviewItem =
        await db.reviewItems.get(
          reviewItemId
        )

      if (!reviewItem) {
        throw new Error(
          'Review item not found.'
        )
      }

      if (
        reviewItem.reviewDraftId !==
        reviewDraft.id
      ) {
        throw new Error(
          'Review item does not belong to this Review.'
        )
      }

      const permanentCategory =
        await db.discoveryCategories.get(
          categoryRef
        )

      const draftCategory =
        await db.reviewDraftCategories.get(
          categoryRef
        )

      const validPermanentCategory =
        permanentCategory?.campaignId ===
        reviewDraft.campaignId

      const validDraftCategory =
        draftCategory?.reviewDraftId ===
        reviewDraft.id

      if (
        !validPermanentCategory &&
        !validDraftCategory
      ) {
        throw new Error(
          'Discovery category is invalid.'
        )
      }

      const timestamp =
        new Date().toISOString()

      const draftDiscovery = {
        id: createId(),
        reviewDraftId,
        title: trimmedTitle,
        categoryRef,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await db.reviewDraftDiscoveries.add(
        draftDiscovery
      )

      const destination = {
        id: createId(),
        reviewItemId,
        destinationType:
          'discovery' as const,
        targetId:
          draftDiscovery.id,
        text: initialText,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await db.reviewDestinations.add(
        destination
      )

      return {
        draftDiscovery,
        destination,
      }
    }
  )
}
/*
 * REVIEW ITEM RESOLUTION
 */

export async function setReviewItemDiscarded(
  reviewItemId: string,
  isDiscarded: boolean
) {
  const reviewItem =
    await db.reviewItems.get(
      reviewItemId
    )

  if (!reviewItem) {
    throw new Error(
      'Review item not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.reviewItems.update(
    reviewItemId,
    {
      isDiscarded,
      updatedAt: timestamp,
    }
  )

  return db.reviewItems.get(
    reviewItemId
  )
}
/*
 * REVIEW RESOLUTION SUMMARY
 */

export async function getReviewResolutionSummary(
  reviewDraftId: string
) {
  const reviewItems =
    await db.reviewItems
      .where('reviewDraftId')
      .equals(reviewDraftId)
      .toArray()

  const reviewItemIds =
    new Set(
      reviewItems.map(
        (item) => item.id
      )
    )

  const destinations =
    await db.reviewDestinations
      .toArray()

  const destinationItemIds =
    new Set(
      destinations
        .filter(
          (destination) =>
            reviewItemIds.has(
              destination.reviewItemId
            )
        )
        .map(
          (destination) =>
            destination.reviewItemId
        )
    )

  const resolvedItemIds =
    reviewItems
      .filter(
        (item) =>
          item.isDiscarded ||
          destinationItemIds.has(
            item.id
          )
      )
      .map(
        (item) => item.id
      )

  return {
    totalCount:
      reviewItems.length,

    resolvedCount:
      resolvedItemIds.length,

    unresolvedCount:
      reviewItems.length -
      resolvedItemIds.length,

    resolvedItemIds,
  }
}
/*
 * REVIEW SUMMARY DATA
 */

export async function getReviewSummaryData(
  reviewDraftId: string
) {
  const reviewItems =
    await db.reviewItems
      .where('reviewDraftId')
      .equals(reviewDraftId)
      .toArray()

  const quickNoteIds =
    reviewItems.map(
      (item) => item.quickNoteId
    )

  const quickNotes =
    await db.quickNotes
      .where('id')
      .anyOf(quickNoteIds)
      .toArray()

  const reviewItemIds =
    reviewItems.map(
      (item) => item.id
    )

  const destinations =
    await db.reviewDestinations
      .where('reviewItemId')
      .anyOf(reviewItemIds)
      .toArray()

  return reviewItems.map(
    (reviewItem) => ({
      reviewItem,

      quickNote:
        quickNotes.find(
          (quickNote) =>
            quickNote.id ===
            reviewItem.quickNoteId
        ),

      destinations:
        destinations.filter(
          (destination) =>
            destination.reviewItemId ===
            reviewItem.id
        ),

      isResolved:
        reviewItem.isDiscarded ||
        destinations.some(
          (destination) =>
            destination.reviewItemId ===
            reviewItem.id
        ),
    })
  )
}
/*
 * COMPLETE REVIEW
 */

export async function completeReview(
  reviewDraftId: string
) {
  return db.transaction(
    'rw',
    [
      db.sessions,
      db.reviewDrafts,
      db.reviewItems,
      db.reviewDestinations,
      db.reviewDraftPeople,
      db.reviewDraftCategories,
      db.reviewDraftDiscoveries,
      db.people,
      db.discoveryCategories,
      db.discoveries,
      db.noteContributions,
    ],
    async () => {
      const reviewDraft =
        await db.reviewDrafts.get(
          reviewDraftId
        )

      if (!reviewDraft) {
        throw new Error(
          'Review draft not found.'
        )
      }

      if (
        reviewDraft.status ===
        'completed'
      ) {
        throw new Error(
          'Review is already completed.'
        )
      }

      const session =
        await db.sessions.get(
          reviewDraft.sessionId
        )

      if (!session) {
        throw new Error(
          'Session not found.'
        )
      }

      const reviewItems =
        await db.reviewItems
          .where('reviewDraftId')
          .equals(reviewDraft.id)
          .toArray()

      const reviewItemIds =
        reviewItems.map(
          (item) => item.id
        )

      const destinations =
        reviewItemIds.length > 0
          ? await db.reviewDestinations
              .where('reviewItemId')
              .anyOf(reviewItemIds)
              .toArray()
          : []

      const discardedItemIds =
        new Set(
          reviewItems
            .filter(
              (item) => item.isDiscarded
            )
            .map(
              (item) => item.id
            )
        )

      const committedDestinations =
        destinations.filter(
          (destination) =>
            !discardedItemIds.has(
              destination.reviewItemId
            )
        )

      const unresolvedItems =
        reviewItems.filter(
          (item) => {
            if (item.isDiscarded) {
              return false
            }

            return !destinations.some(
              (destination) =>
                destination.reviewItemId ===
                item.id
            )
          }
        )

      if (
        unresolvedItems.length > 0
      ) {
        throw new Error(
          'All Review Items must be resolved before completion.'
        )
      }

      const timestamp =
        new Date().toISOString()

      const draftPeople =
        await db.reviewDraftPeople
          .where('reviewDraftId')
          .equals(reviewDraft.id)
          .toArray()

      const draftCategories =
        await db.reviewDraftCategories
          .where('reviewDraftId')
          .equals(reviewDraft.id)
          .toArray()

      const draftDiscoveries =
        await db.reviewDraftDiscoveries
          .where('reviewDraftId')
          .equals(reviewDraft.id)
          .toArray()

      const personIdMap =
        new Map<string, string>()

      for (
        const draftPerson
        of draftPeople
      ) {
        const isReferenced =
          committedDestinations.some(
            (destination) =>
              destination.destinationType ===
                'person' &&
              destination.targetId ===
                draftPerson.id
          )

        if (!isReferenced) {
          continue
        }

        const permanentId =
          createId()

        personIdMap.set(
          draftPerson.id,
          permanentId
        )

        await db.people.add({
          id: permanentId,
          campaignId:
            reviewDraft.campaignId,
          name: draftPerson.name,
          description: '',
          notes: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }

      const categoryIdMap =
        new Map<string, string>()

      const existingCategories =
        await db.discoveryCategories
          .where('campaignId')
          .equals(
            reviewDraft.campaignId
          )
          .toArray()

      let nextSortPosition =
        existingCategories.length

      for (
        const draftCategory
        of draftCategories
      ) {
        const isUsed =
          draftDiscoveries.some(
            (discovery) =>
              discovery.categoryRef ===
              draftCategory.id
          )

        if (!isUsed) {
          continue
        }

        const permanentId =
          createId()

        categoryIdMap.set(
          draftCategory.id,
          permanentId
        )

        await db.discoveryCategories.add({
          id: permanentId,
          campaignId:
            reviewDraft.campaignId,
          name: draftCategory.name,
          sortPosition:
            nextSortPosition,
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        nextSortPosition += 1
      }

      const discoveryIdMap =
        new Map<string, string>()

      for (
        const draftDiscovery
        of draftDiscoveries
      ) {
        const isReferenced =
          committedDestinations.some(
            (destination) =>
              destination.destinationType ===
                'discovery' &&
              destination.targetId ===
                draftDiscovery.id
          )

        if (!isReferenced) {
          continue
        }

        const permanentCategoryId =
          categoryIdMap.get(
            draftDiscovery.categoryRef
          ) ??
          draftDiscovery.categoryRef

        const permanentId =
          createId()

        discoveryIdMap.set(
          draftDiscovery.id,
          permanentId
        )

        await db.discoveries.add({
          id: permanentId,
          campaignId:
            reviewDraft.campaignId,
          title:
            draftDiscovery.title,
          categoryId:
            permanentCategoryId,
          discoveredInSessionId:
            session.id,
          notes: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }

      const journalTexts =
        committedDestinations
          .filter(
            (destination) =>
              destination.destinationType ===
              'journal'
          )
          .map(
            (destination) =>
              destination.text.trim()
          )
          .filter(Boolean)

      const journalText =
        journalTexts.join('\n\n')

      for (
        const destination
        of committedDestinations
      ) {
        if (
          destination.destinationType ===
            'person' &&
          destination.targetId
        ) {
          const permanentPersonId =
            personIdMap.get(
              destination.targetId
            ) ??
            destination.targetId

          const person =
            await db.people.get(
              permanentPersonId
            )

          if (person) {
            const contributionText =
              destination.text.trim()

            const nextNotes =
              [
                person.notes.trim(),
                contributionText,
              ]
                .filter(Boolean)
                .join('\n')

            await db.people.update(
              permanentPersonId,
              {
                notes: nextNotes,
                updatedAt: timestamp,
              }
            )

            if (contributionText) {
              await db.noteContributions.add({
                id: createId(),
                campaignId:
                  reviewDraft.campaignId,
                targetType: 'person',
                targetId:
                  permanentPersonId,
                sessionId: session.id,
                text: contributionText,
                createdAt: timestamp,
                updatedAt: timestamp,
              })
            }
          }
        }

        if (
          destination.destinationType ===
            'discovery' &&
          destination.targetId
        ) {
          const permanentDiscoveryId =
            discoveryIdMap.get(
              destination.targetId
            ) ??
            destination.targetId

          const discovery =
            await db.discoveries.get(
              permanentDiscoveryId
            )

          if (discovery) {
            const contributionText =
              destination.text.trim()

            const nextNotes =
              [
                discovery.notes.trim(),
                contributionText,
              ]
                .filter(Boolean)
                .join('\n')

            await db.discoveries.update(
              permanentDiscoveryId,
              {
                notes: nextNotes,
                updatedAt: timestamp,
              }
            )

            if (contributionText) {
              await db.noteContributions.add({
                id: createId(),
                campaignId:
                  reviewDraft.campaignId,
                targetType: 'discovery',
                targetId:
                  permanentDiscoveryId,
                sessionId: session.id,
                text: contributionText,
                createdAt: timestamp,
                updatedAt: timestamp,
              })
            }
          }
        }
      }

      await db.sessions.update(
        session.id,
        {
          status: 'completed',
          journalText,
          reviewCompletedAt:
            timestamp,
          updatedAt: timestamp,
        }
      )

      await db.reviewDrafts.update(
        reviewDraft.id,
        {
          status: 'completed',
          updatedAt: timestamp,
        }
      )

      return {
        sessionId: session.id,
        journalText,
        createdPeople:
          Array.from(
            personIdMap.values()
          ),
        createdDiscoveries:
          Array.from(
            discoveryIdMap.values()
          ),
      }
    }
  )
}
/*
 * COMPLETED SESSIONS
 */

export async function getSession(
  sessionId: string
) {
  return db.sessions.get(sessionId)
}

export async function getSessionsForEntry(
  campaignId: string,
  targetType: 'person' | 'discovery',
  targetId: string
) {
  const contributions =
    await db.noteContributions
      .where('targetId')
      .equals(targetId)
      .filter(
        (contribution) =>
          contribution.campaignId ===
            campaignId &&
          contribution.targetType ===
            targetType &&
          Boolean(
            contribution.sessionId
          )
      )
      .toArray()

  const sessionIds =
    Array.from(
      new Set(
        contributions
          .map(
            (contribution) =>
              contribution.sessionId
          )
          .filter(
            (
              sessionId
            ): sessionId is string =>
              Boolean(sessionId)
          )
      )
    )

  if (sessionIds.length === 0) {
    return []
  }

  const sessions =
    await db.sessions
      .where('id')
      .anyOf(sessionIds)
      .toArray()

  return sessions
    .filter(
      (session) =>
        session.campaignId ===
        campaignId
    )
    .sort(
      (a, b) =>
        b.sessionNumber -
        a.sessionNumber
    )
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
) {
  const session =
    await db.sessions.get(sessionId)

  if (!session) {
    throw new Error(
      'Session not found.'
    )
  }

  await db.sessions.update(
    sessionId,
    {
      title,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.sessions.get(sessionId)
}

export async function getCompletedSessions(
  campaignId: string
) {
  const sessions =
    await db.sessions
      .where('campaignId')
      .equals(campaignId)
      .filter(
        (session) =>
          session.status ===
          'completed'
      )
      .toArray()

  return sessions.sort(
    (a, b) =>
      b.sessionNumber -
      a.sessionNumber
  )
}
/*
 * CHARACTER
 */

export async function getCharacter(
  campaignId: string
) {
  return db.characters
    .where('campaignId')
    .equals(campaignId)
    .first()
}

export async function getOrCreateCharacter(
  campaignId: string
) {
  const existingCharacter =
    await getCharacter(campaignId)

  if (existingCharacter) {
    return existingCharacter
  }

  const campaign =
    await db.campaigns.get(campaignId)

  if (!campaign) {
    throw new Error(
      'Campaign not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const character = {
    id: createId(),
    campaignId,

    name: '',
    ancestry: '',
    characterClass: '',

    level: null,
    xp: null,

    title: '',
    alignment: '',
    background: '',
    deity: '',

    strength: {
      score: null,
      modifier: null,
    },

    dexterity: {
      score: null,
      modifier: null,
    },

    constitution: {
      score: null,
      modifier: null,
    },

    intelligence: {
      score: null,
      modifier: null,
    },

    wisdom: {
      score: null,
      modifier: null,
    },

    charisma: {
      score: null,
      modifier: null,
    },

    currentHp: null,
    maxHp: null,
    armorClass: null,

    attacks: '',
    talentsAndSpells: '',

    gear: Array(20).fill(''),
    freeToCarry: '',

    gp: null,
    sp: null,
    cp: null,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.characters.add(
    character
  )

  return character
}

export async function updateCharacter(
  characterId: string,
  changes: Partial<
    Omit<
      import('./database').Character,
      'id' | 'campaignId' | 'createdAt'
    >
  >
) {
  const character =
    await db.characters.get(
      characterId
    )

  if (!character) {
    throw new Error(
      'Character not found.'
    )
  }

  const timestamp =
    new Date().toISOString()

  await db.characters.update(
    characterId,
    {
      ...changes,
      updatedAt: timestamp,
    }
  )

  return db.characters.get(
    characterId
  )
}

/*
 * GOALS
 */

export async function getGoals(
  campaignId: string
) {
  const goals =
    await db.goals
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  return goals.sort(
    (a, b) =>
      a.createdAt.localeCompare(
        b.createdAt
      )
  )
}

export async function addGoal(
  campaignId: string,
  term:
    | 'short'
    | 'mid'
    | 'long'
) {
  const timestamp =
    new Date().toISOString()

  const goal = {
    id: createId(),
    campaignId,

    title: '',
    term,

    background: '',
    goal: '',
    howToMeasure: '',
    downside: '',

    hasSetback: false,
    status: 'active' as const,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.goals.add(goal)

  return goal
}

export async function updateGoal(
  goalId: string,
  changes: {
    title?: string
    term?:
      | 'short'
      | 'mid'
      | 'long'
    background?: string
    goal?: string
    howToMeasure?: string
    downside?: string
    hasSetback?: boolean
  }
) {
  const goal =
    await db.goals.get(goalId)

  if (!goal) {
    throw new Error(
      'Goal not found.'
    )
  }

  await db.goals.update(
    goalId,
    {
      ...changes,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.goals.get(goalId)
}

export async function completeGoal(
  goalId: string
) {
  const goal =
    await db.goals.get(goalId)

  if (!goal) {
    throw new Error(
      'Goal not found.'
    )
  }

  await db.goals.update(
    goalId,
    {
      status: 'completed',
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.goals.get(goalId)
}

export async function reopenGoal(
  goalId: string
) {
  const goal =
    await db.goals.get(goalId)

  if (!goal) {
    throw new Error(
      'Goal not found.'
    )
  }

  await db.goals.update(
    goalId,
    {
      status: 'active',
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.goals.get(goalId)
}

export async function deleteGoal(
  goalId: string
) {
  await db.goals.delete(
    goalId
  )
}

/*
 * REMINDERS
 */

export async function getReminders(
  campaignId: string
) {
  const reminders =
    await db.reminders
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  return reminders.sort(
    (a, b) =>
      a.createdAt.localeCompare(
        b.createdAt
      )
  )
}

export async function addReminder(
  campaignId: string
) {
  const timestamp =
    new Date().toISOString()

  const reminder = {
    id: createId(),
    campaignId,

    title: '',
    todaySummary: '',
    content: '',

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reminders.add(
    reminder
  )

  return reminder
}

export async function updateReminder(
  reminderId: string,
  changes: {
    title?: string
    todaySummary?: string
    content?: string
  }
) {
  const reminder =
    await db.reminders.get(
      reminderId
    )

  if (!reminder) {
    throw new Error(
      'Reminder not found.'
    )
  }

  await db.reminders.update(
    reminderId,
    {
      ...changes,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.reminders.get(
    reminderId
  )
}

export async function deleteReminder(
  reminderId: string
) {
  await db.reminders.delete(
    reminderId
  )
}

export async function exportCampaign(
  campaignId: string
) {
  const campaign =
    await db.campaigns.get(campaignId)

  if (!campaign) {
    throw new Error(
      'Campaign not found.'
    )
  }

  // Direct campaign-owned records
  const [
    characters,
    goals,
    reminders,
    sessions,
    quickNotes,
    people,
    discoveryCategories,
    discoveries,
    reviewDrafts,
    noteContributions,
  ] = await Promise.all([
    db.characters
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.goals
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.reminders
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.sessions
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.quickNotes
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.people
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.discoveryCategories
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.discoveries
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.reviewDrafts
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.noteContributions
      .where('campaignId')
      .equals(campaignId)
      .toArray(),
  ])

  /*
    The remaining Review tables don't
    contain campaignId directly.

    We therefore collect them through
    their parent Review Draft / Item.
  */

  const reviewDraftIds =
    reviewDrafts.map(
      (draft) => draft.id
    )

  const reviewItems =
    reviewDraftIds.length > 0
      ? await db.reviewItems
          .where('reviewDraftId')
          .anyOf(reviewDraftIds)
          .toArray()
      : []

  const [
    reviewDraftPeople,
    reviewDraftCategories,
    reviewDraftDiscoveries,
  ] =
    reviewDraftIds.length > 0
      ? await Promise.all([
          db.reviewDraftPeople
            .where('reviewDraftId')
            .anyOf(reviewDraftIds)
            .toArray(),

          db.reviewDraftCategories
            .where('reviewDraftId')
            .anyOf(reviewDraftIds)
            .toArray(),

          db.reviewDraftDiscoveries
            .where('reviewDraftId')
            .anyOf(reviewDraftIds)
            .toArray(),
        ])
      : [[], [], []]

  const reviewItemIds =
    reviewItems.map(
      (item) => item.id
    )

  const reviewDestinations =
    reviewItemIds.length > 0
      ? await db.reviewDestinations
          .where('reviewItemId')
          .anyOf(reviewItemIds)
          .toArray()
      : []

  return {
    format:
      'campaign-guide-backup',
    version: 1,
    exportedAt:
      new Date().toISOString(),

    campaign,

    data: {
      characters,
      goals,
      reminders,
      sessions,
      quickNotes,
      people,
      discoveryCategories,
      discoveries,
      reviewDrafts,
      reviewItems,
      reviewDraftPeople,
      reviewDraftCategories,
      reviewDraftDiscoveries,
      reviewDestinations,
      noteContributions,
    },
  }
}

export async function importCampaign(
  backup: any
) {
  // ---------- Basic validation ----------

  if (
    !backup ||
    backup.format !==
      'campaign-guide-backup' ||
    backup.version !== 1 ||
    !backup.campaign ||
    !backup.data
  ) {
    throw new Error(
      'This is not a valid Campaign Guide backup.'
    )
  }

  const campaignId =
    backup.campaign.id

  if (!campaignId) {
    throw new Error(
      'Backup has no campaign ID.'
    )
  }

  const existingCampaign =
    await db.campaigns.get(
      campaignId
    )

  /*
    For now we deliberately refuse to
    overwrite an existing campaign.

    App.tsx will later decide whether
    replacement is allowed.
  */
  if (existingCampaign) {
    return {
      status:
        'campaign_exists' as const,
      campaign:
        existingCampaign,
    }
  }

  const data = backup.data

  await db.transaction(
    'rw',
    [
      db.campaigns,
      db.characters,
      db.goals,
      db.reminders,
      db.sessions,
      db.quickNotes,
      db.people,
      db.discoveryCategories,
      db.discoveries,
      db.reviewDrafts,
      db.reviewItems,
      db.reviewDraftPeople,
      db.reviewDraftCategories,
      db.reviewDraftDiscoveries,
      db.reviewDestinations,
      db.noteContributions,
    ],
    async () => {
      await db.campaigns.add(
        backup.campaign
      )

      if (data.characters?.length) {
        await db.characters.bulkAdd(
          data.characters
        )
      }

      if (data.goals?.length) {
        await db.goals.bulkAdd(
          data.goals
        )
      }

      if (data.reminders?.length) {
        await db.reminders.bulkAdd(
          data.reminders
        )
      }

      if (data.sessions?.length) {
        await db.sessions.bulkAdd(
          data.sessions
        )
      }

      if (data.quickNotes?.length) {
        await db.quickNotes.bulkAdd(
          data.quickNotes
        )
      }

      if (data.people?.length) {
        await db.people.bulkAdd(
          data.people
        )
      }

      if (
        data.discoveryCategories
          ?.length
      ) {
        await db.discoveryCategories
          .bulkAdd(
            data.discoveryCategories
          )
      }

      if (
        data.discoveries?.length
      ) {
        await db.discoveries.bulkAdd(
          data.discoveries
        )
      }

      if (
        data.reviewDrafts?.length
      ) {
        await db.reviewDrafts.bulkAdd(
          data.reviewDrafts
        )
      }

      if (
        data.reviewItems?.length
      ) {
        await db.reviewItems.bulkAdd(
          data.reviewItems
        )
      }

      if (
        data.reviewDraftPeople
          ?.length
      ) {
        await db.reviewDraftPeople
          .bulkAdd(
            data.reviewDraftPeople
          )
      }

      if (
        data.reviewDraftCategories
          ?.length
      ) {
        await db.reviewDraftCategories
          .bulkAdd(
            data.reviewDraftCategories
          )
      }

      if (
        data.reviewDraftDiscoveries
          ?.length
      ) {
        await db.reviewDraftDiscoveries
          .bulkAdd(
            data.reviewDraftDiscoveries
          )
      }

      if (
        data.reviewDestinations
          ?.length
      ) {
        await db.reviewDestinations
          .bulkAdd(
            data.reviewDestinations
          )
      }

      if (
        data.noteContributions
          ?.length
      ) {
        await db.noteContributions
          .bulkAdd(
            data.noteContributions
          )
      }
    }
  )

  return {
    status: 'imported' as const,
    campaign:
      backup.campaign,
  }
}

export async function replaceCampaignFromBackup(
  backup: any
) {
  // ---------- Basic validation ----------

  if (
    !backup ||
    backup.format !==
      'campaign-guide-backup' ||
    backup.version !== 1 ||
    !backup.campaign ||
    !backup.data
  ) {
    throw new Error(
      'This is not a valid Campaign Guide backup.'
    )
  }

  const campaignId =
    backup.campaign.id

  if (!campaignId) {
    throw new Error(
      'Backup has no campaign ID.'
    )
  }

  const existingCampaign =
    await db.campaigns.get(
      campaignId
    )

  if (!existingCampaign) {
    throw new Error(
      'Campaign to replace was not found.'
    )
  }

  const data = backup.data

  await db.transaction(
    'rw',
    [
      db.campaigns,
      db.characters,
      db.goals,
      db.reminders,
      db.sessions,
      db.quickNotes,
      db.people,
      db.discoveryCategories,
      db.discoveries,
      db.reviewDrafts,
      db.reviewItems,
      db.reviewDraftPeople,
      db.reviewDraftCategories,
      db.reviewDraftDiscoveries,
      db.reviewDestinations,
      db.noteContributions,
    ],
    async () => {
      /*
        Find existing Review records
        before deleting their parents.
      */

      const existingReviewDrafts =
        await db.reviewDrafts
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      const reviewDraftIds =
        existingReviewDrafts.map(
          (draft) => draft.id
        )

      const existingReviewItems =
        reviewDraftIds.length > 0
          ? await db.reviewItems
              .where('reviewDraftId')
              .anyOf(reviewDraftIds)
              .toArray()
          : []

      const reviewItemIds =
        existingReviewItems.map(
          (item) => item.id
        )

      // ---------- Delete old data ----------

      if (reviewItemIds.length > 0) {
        await db.reviewDestinations
          .where('reviewItemId')
          .anyOf(reviewItemIds)
          .delete()
      }

      if (reviewDraftIds.length > 0) {
        await db.reviewDraftPeople
          .where('reviewDraftId')
          .anyOf(reviewDraftIds)
          .delete()

        await db.reviewDraftCategories
          .where('reviewDraftId')
          .anyOf(reviewDraftIds)
          .delete()

        await db.reviewDraftDiscoveries
          .where('reviewDraftId')
          .anyOf(reviewDraftIds)
          .delete()

        await db.reviewItems
          .where('reviewDraftId')
          .anyOf(reviewDraftIds)
          .delete()
      }

      await db.reviewDrafts
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.noteContributions
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.discoveries
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.discoveryCategories
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.people
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.quickNotes
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.sessions
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.reminders
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.goals
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.characters
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.campaigns.delete(
        campaignId
      )

      // ---------- Restore backup ----------

      await db.campaigns.add(
        backup.campaign
      )

      if (data.characters?.length) {
        await db.characters.bulkAdd(
          data.characters
        )
      }

      if (data.goals?.length) {
        await db.goals.bulkAdd(
          data.goals
        )
      }

      if (data.reminders?.length) {
        await db.reminders.bulkAdd(
          data.reminders
        )
      }

      if (data.sessions?.length) {
        await db.sessions.bulkAdd(
          data.sessions
        )
      }

      if (data.quickNotes?.length) {
        await db.quickNotes.bulkAdd(
          data.quickNotes
        )
      }

      if (data.people?.length) {
        await db.people.bulkAdd(
          data.people
        )
      }

      if (
        data.discoveryCategories
          ?.length
      ) {
        await db.discoveryCategories
          .bulkAdd(
            data.discoveryCategories
          )
      }

      if (data.discoveries?.length) {
        await db.discoveries.bulkAdd(
          data.discoveries
        )
      }

      if (data.reviewDrafts?.length) {
        await db.reviewDrafts.bulkAdd(
          data.reviewDrafts
        )
      }

      if (data.reviewItems?.length) {
        await db.reviewItems.bulkAdd(
          data.reviewItems
        )
      }

      if (
        data.reviewDraftPeople
          ?.length
      ) {
        await db.reviewDraftPeople
          .bulkAdd(
            data.reviewDraftPeople
          )
      }

      if (
        data.reviewDraftCategories
          ?.length
      ) {
        await db.reviewDraftCategories
          .bulkAdd(
            data.reviewDraftCategories
          )
      }

      if (
        data.reviewDraftDiscoveries
          ?.length
      ) {
        await db.reviewDraftDiscoveries
          .bulkAdd(
            data.reviewDraftDiscoveries
          )
      }

      if (
        data.reviewDestinations
          ?.length
      ) {
        await db.reviewDestinations
          .bulkAdd(
            data.reviewDestinations
          )
      }

      if (
        data.noteContributions
          ?.length
      ) {
        await db.noteContributions
          .bulkAdd(
            data.noteContributions
          )
      }
    }
  )

  return backup.campaign
}