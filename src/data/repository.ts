import { db, type Campaign } from './database'

function nowIso() {
  return new Date().toISOString()
}

export async function getCampaign(): Promise<
  Campaign | undefined
> {
  return db.campaigns.toCollection().first()
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
    id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
  return db.reviewItems
    .where('reviewDraftId')
    .equals(reviewDraftId)
    .toArray()
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
          id: crypto.randomUUID(),
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
              id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
          crypto.randomUUID()

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
          crypto.randomUUID()

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
          crypto.randomUUID()

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
            const nextNotes =
              [
                person.notes.trim(),
                destination.text.trim(),
              ]
                .filter(Boolean)
                .join('\n\n')

            await db.people.update(
              permanentPersonId,
              {
                notes: nextNotes,
                updatedAt: timestamp,
              }
            )
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
            const nextNotes =
              [
                discovery.notes.trim(),
                destination.text.trim(),
              ]
                .filter(Boolean)
                .join('\n\n')

            await db.discoveries.update(
              permanentDiscoveryId,
              {
                notes: nextNotes,
                updatedAt: timestamp,
              }
            )
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