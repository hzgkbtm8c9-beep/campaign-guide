import { db, type Campaign } from './database'

function nowIso() {
  return new Date().toISOString()
}

export async function getCampaign(): Promise<Campaign | undefined> {
  return db.campaigns.toCollection().first()
}

export async function createCampaign(name: string): Promise<Campaign> {
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
}export async function getActiveSession(campaignId: string) {
  return db.sessions
    .where('campaignId')
    .equals(campaignId)
    .filter((session) => session.status === 'active')
    .first()
}

export async function startSession(campaignId: string) {
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
}export async function createQuickNote(
  campaignId: string,
  sessionId: string,
  text: string
) {
  const trimmedText = text.trim()

  if (!trimmedText) {
    throw new Error('Quick Note text is required.')
  }

  const timestamp = new Date().toISOString()

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
}export async function endSession(sessionId: string) {
  const session = await db.sessions.get(sessionId)

  if (!session) {
    throw new Error('Session not found.')
  }

  if (session.status !== 'active') {
    throw new Error('Only an active session can be ended.')
  }

  const timestamp = new Date().toISOString()

  await db.sessions.update(sessionId, {
    status: 'awaiting_review',
    endedAt: timestamp,
    updatedAt: timestamp,
  })

  return db.sessions.get(sessionId)
}

export async function getOpenReviews(campaignId: string) {
  const sessions = await db.sessions
    .where('campaignId')
    .equals(campaignId)
    .filter(
      (session) =>
        session.status === 'awaiting_review' ||
        session.status === 'reviewing'
    )
    .toArray()

  return sessions.sort(
    (a, b) =>
      new Date(a.endedAt ?? a.createdAt).getTime() -
      new Date(b.endedAt ?? b.createdAt).getTime()
  )
}export async function getReviewDraftForSession(
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
      const session = await db.sessions.get(sessionId)

      if (!session) {
        throw new Error('Session not found.')
      }

      if (
        session.status !== 'awaiting_review' &&
        session.status !== 'reviewing'
      ) {
        throw new Error(
          'Only an open review can be started or resumed.'
        )
      }

      let reviewDraft =
        await getReviewDraftForSession(sessionId)

      if (!reviewDraft) {
        const timestamp = new Date().toISOString()

        const quickNotes =
          await getQuickNotesForSession(sessionId)

        reviewDraft = {
          id: crypto.randomUUID(),
          campaignId: session.campaignId,
          sessionId: session.id,
          status: 'in_progress' as const,
          currentReviewItemId: undefined,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        await db.reviewDrafts.add(reviewDraft)

        const reviewItems = quickNotes.map(
          (quickNote) => ({
            id: crypto.randomUUID(),
            reviewDraftId: reviewDraft!.id,
            quickNoteId: quickNote.id,
            workingText: quickNote.text,
            isDiscarded: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        )

        if (reviewItems.length > 0) {
          await db.reviewItems.bulkAdd(reviewItems)

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

        await db.sessions.update(session.id, {
          status: 'reviewing',
          updatedAt: timestamp,
        })
      }

      const reviewItems =
        await getReviewItems(reviewDraft.id)

      return {
        reviewDraft,
        reviewItems,
      }
    }
  )
}export async function updateReviewItemText(
  reviewItemId: string,
  workingText: string
) {
  const reviewItem =
    await db.reviewItems.get(reviewItemId)

  if (!reviewItem) {
    throw new Error('Review item not found.')
  }

  const timestamp = new Date().toISOString()

  await db.reviewItems.update(reviewItemId, {
    workingText,
    updatedAt: timestamp,
  })

  return db.reviewItems.get(reviewItemId)
}

export async function setCurrentReviewItem(
  reviewDraftId: string,
  reviewItemId: string
) {
  const reviewDraft =
    await db.reviewDrafts.get(reviewDraftId)

  if (!reviewDraft) {
    throw new Error('Review draft not found.')
  }

  const reviewItem =
    await db.reviewItems.get(reviewItemId)

  if (!reviewItem) {
    throw new Error('Review item not found.')
  }

  if (reviewItem.reviewDraftId !== reviewDraftId) {
    throw new Error(
      'Review item does not belong to this review.'
    )
  }

  const timestamp = new Date().toISOString()

  await db.reviewDrafts.update(reviewDraftId, {
    currentReviewItemId: reviewItemId,
    updatedAt: timestamp,
  })
}export async function getReviewDestinations(
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
          destination.destinationType === 'journal'
      )
      .first()

  if (existing) {
    return existing
  }

  const timestamp = new Date().toISOString()

  const destination = {
    id: crypto.randomUUID(),
    reviewItemId,
    destinationType: 'journal' as const,
    targetId: undefined,
    text: initialText,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.reviewDestinations.add(destination)

  return destination
}

export async function updateReviewDestinationText(
  destinationId: string,
  text: string
) {
  const destination =
    await db.reviewDestinations.get(destinationId)

  if (!destination) {
    throw new Error(
      'Review destination not found.'
    )
  }

  const timestamp = new Date().toISOString()

  await db.reviewDestinations.update(
    destinationId,
    {
      text,
      updatedAt: timestamp,
    }
  )

  return db.reviewDestinations.get(destinationId)
}

export async function removeReviewDestination(
  destinationId: string
) {
  const destination =
    await db.reviewDestinations.get(destinationId)

  if (!destination) {
    return
  }

  await db.reviewDestinations.delete(destinationId)
}