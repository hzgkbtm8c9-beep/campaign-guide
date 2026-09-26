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

export async function deleteCampaign(
  campaignId: string
) {
  return db.transaction(
    'rw',
    [
      db.campaigns,
      db.characters,
      db.equipmentItems,
      db.characterModules,
      db.companionModuleData,
      db.companionAbilities,
      db.weatherModuleData,
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
      db.entityRedirects,
    ],
    async () => {
      const sessions =
        await db.sessions
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      const sessionIds =
        sessions.map(
          (session) => session.id
        )

      const reviewDrafts =
        await db.reviewDrafts
          .where('campaignId')
          .equals(campaignId)
          .toArray()

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

      const reviewItemIds =
        reviewItems.map(
          (item) => item.id
        )

      if (reviewItemIds.length > 0) {
        await db.reviewDestinations
          .where('reviewItemId')
          .anyOf(reviewItemIds)
          .delete()

        await db.reviewItems
          .where('id')
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

        await db.reviewDrafts
          .where('id')
          .anyOf(reviewDraftIds)
          .delete()
      }

      if (sessionIds.length > 0) {
        await db.quickNotes
          .where('sessionId')
          .anyOf(sessionIds)
          .delete()
      }

      await db.noteContributions
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.entityRedirects
        .where('campaignId')
        .equals(campaignId)
        .delete()

      const characterModules =
        await db.characterModules
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      const characterModuleIds =
        characterModules.map(
          (module) => module.id
        )

      if (characterModuleIds.length > 0) {
        await db.companionAbilities
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .delete()

        await db.companionModuleData
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .delete()

        await db.weatherModuleData
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .delete()

        await db.characterModules
          .where('id')
          .anyOf(characterModuleIds)
          .delete()
      }

      await db.equipmentItems
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.characters
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.goals
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.reminders
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.people
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

      await db.sessions
        .where('campaignId')
        .equals(campaignId)
        .delete()

      await db.campaigns.delete(
        campaignId
      )
    }
  )
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

export interface CampfireQuickNote {
  shareId: string
  text: string
  capturedAt: string
}

export interface CampfireSession {
  sessionNumber: number
  title: string
  startedAt: string
  endedAt?: string
  quickNotes: CampfireQuickNote[]
}

export interface CampfirePackage {
  type: 'campaign-guide-campfire'
  version: 1
  senderName: string
  exportedAt: string
  sessions: CampfireSession[]
}

export async function exportCampfirePackage(
  campaignId: string,
  sessionIds: string[]
): Promise<CampfirePackage> {
  const character =
    await db.characters
      .where('campaignId')
      .equals(campaignId)
      .first()

  const sessions =
    await db.sessions.bulkGet(sessionIds)

  const validSessions =
    sessions.filter(
      (
        session
      ): session is NonNullable<
        typeof session
      > =>
        Boolean(
          session &&
            session.campaignId ===
              campaignId &&
            session.status !== 'active'
        )
    )

  const campfireSessions =
    await Promise.all(
      validSessions.map(
        async (session) => {
          const quickNotes =
            (
              await getQuickNotesForSession(
                session.id
              )
            ).filter(
              (quickNote) =>
                !quickNote.receivedViaCampfire
            )

          return {
            sessionNumber:
              session.sessionNumber,
            title: session.title,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            quickNotes: quickNotes.map(
              (quickNote) => ({
                shareId:
                  quickNote.shareId ??
                  quickNote.id,
                text: quickNote.text,
                capturedAt:
                  quickNote.capturedAt,
              })
            ),
          }
        }
      )
    )

  return {
    type: 'campaign-guide-campfire',
    version: 1,
    senderName:
      character?.name?.trim() ||
      'Unknown adventurer',
    exportedAt:
      new Date().toISOString(),
    sessions: campfireSessions,
  }
}

export async function downloadCampfirePackage(
  campaignId: string,
  sessionIds: string[]
) {
  const campfirePackage =
    await exportCampfirePackage(
      campaignId,
      sessionIds
    )

  if (campfirePackage.sessions.length === 0) {
    throw new Error(
      'Select at least one ended Session to share.'
    )
  }

  const blob = new Blob(
    [
      JSON.stringify(
        campfirePackage,
        null,
        2
      ),
    ],
    {
      type: 'application/json',
    }
  )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download =
    `campfire-${new Date()
      .toISOString()
      .slice(0, 10)}.json`

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

export async function parseCampfireFile(
  file: File
): Promise<CampfirePackage> {
  let parsed: unknown

  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    throw new Error(
      'The selected file is not valid JSON.'
    )
  }

  if (
    !parsed ||
    typeof parsed !== 'object'
  ) {
    throw new Error(
      'This is not a valid Campfire file.'
    )
  }

  const candidate =
    parsed as Partial<CampfirePackage>

  if (
    candidate.type !==
      'campaign-guide-campfire' ||
    candidate.version !== 1 ||
    typeof candidate.senderName !==
      'string' ||
    typeof candidate.exportedAt !==
      'string' ||
    !Array.isArray(candidate.sessions)
  ) {
    throw new Error(
      'This is not a valid Campfire file.'
    )
  }

  for (const session of candidate.sessions) {
    if (
      !session ||
      typeof session !== 'object' ||
      typeof session.sessionNumber !==
        'number' ||
      typeof session.title !== 'string' ||
      typeof session.startedAt !==
        'string' ||
      (
        session.endedAt !== undefined &&
        typeof session.endedAt !==
          'string'
      ) ||
      !Array.isArray(session.quickNotes)
    ) {
      throw new Error(
        'This Campfire file contains invalid Session data.'
      )
    }

    for (
      const quickNote
      of session.quickNotes
    ) {
      if (
        !quickNote ||
        typeof quickNote !== 'object' ||
        typeof quickNote.shareId !==
          'string' ||
        typeof quickNote.text !==
          'string' ||
        typeof quickNote.capturedAt !==
          'string'
      ) {
        throw new Error(
          'This Campfire file contains invalid Quick Note data.'
        )
      }
    }
  }

  return candidate as CampfirePackage
}

export async function importCampfireSession(
  campaignId: string,
  localSessionId: string,
  incomingSession: CampfireSession
) {
  const session =
    await db.sessions.get(
      localSessionId
    )

  if (
    !session ||
    session.campaignId !== campaignId
  ) {
    throw new Error(
      'The selected local Session was not found.'
    )
  }

  if (session.status === 'active') {
    throw new Error(
      'Campfire notes cannot be imported into an active Session.'
    )
  }

  const existingQuickNotes =
    await db.quickNotes
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  const existingShareIds =
    new Set(
      existingQuickNotes.map(
        (quickNote) =>
          quickNote.shareId
      )
    )

  const newQuickNotes =
    incomingSession.quickNotes
      .filter(
        (quickNote) =>
          !existingShareIds.has(
            quickNote.shareId
          )
      )
      .map((quickNote) => {
        const timestamp =
          new Date().toISOString()

        return {
          id: createId(),
          campaignId,
          sessionId: localSessionId,
          shareId: quickNote.shareId,
          receivedViaCampfire: true,
          text: quickNote.text,
          capturedAt:
            quickNote.capturedAt,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      })

  if (newQuickNotes.length > 0) {
    await db.quickNotes.bulkAdd(
      newQuickNotes
    )

    if (
      session.status === 'reviewing' ||
      session.status === 'completed'
    ) {
      await startOrResumeReview(
        session.id
      )
    }
  }

  return {
    importedCount:
      newQuickNotes.length,
    duplicateCount:
      incomingSession.quickNotes.length -
      newQuickNotes.length,
  }
}

export async function importCampfirePackage(
  campaignId: string,
  campfirePackage: CampfirePackage,
  mappings: CampfireSessionMapping[]
) {
  let importedCount = 0
  let duplicateCount = 0
  let skippedSessionCount = 0

  for (const mapping of mappings) {
    const incomingSession =
      campfirePackage.sessions[
        mapping.incomingSessionIndex
      ]

    if (!incomingSession) {
      throw new Error(
        'A Campfire Session mapping is invalid.'
      )
    }

    if (!mapping.localSessionId) {
      skippedSessionCount += 1
      continue
    }

    const result =
      await importCampfireSession(
        campaignId,
        mapping.localSessionId,
        incomingSession
      )

    importedCount +=
      result.importedCount

    duplicateCount +=
      result.duplicateCount
  }

  return {
    importedCount,
    duplicateCount,
    skippedSessionCount,
  }
}

export interface CampfireSessionMapping {
  incomingSessionIndex: number
  localSessionId?: string
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

  const id = createId()

  const quickNote = {
    id,
    campaignId,
    sessionId,
    shareId: id,
    receivedViaCampfire: false,
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

export async function updateQuickNote(
  quickNoteId: string,
  text: string
) {
  const trimmedText = text.trim()

  if (!trimmedText) {
    throw new Error(
      'Quick Note text is required.'
    )
  }

  const quickNote =
    await db.quickNotes.get(
      quickNoteId
    )

  if (!quickNote) {
    throw new Error(
      'Quick Note not found.'
    )
  }

  await db.quickNotes.update(
    quickNoteId,
    {
      text: trimmedText,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.quickNotes.get(
    quickNoteId
  )
}

export async function deleteQuickNote(
  quickNoteId: string
) {
  const quickNote =
    await db.quickNotes.get(
      quickNoteId
    )

  if (!quickNote) {
    return
  }

  await db.quickNotes.delete(
    quickNoteId
  )
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

export async function getOpenReviewCampfireSessionIds(
  campaignId: string
): Promise<string[]> {
  const openReviews =
    await getOpenReviews(campaignId)

  const campfireSessionIds =
    await Promise.all(
      openReviews.map(
        async (session) => {
          const quickNotes =
            await getQuickNotesForSession(
              session.id
            )

          const reviewDraft =
            await db.reviewDrafts
              .where('sessionId')
              .equals(session.id)
              .first()

          if (!reviewDraft) {
            return quickNotes.some(
              (quickNote) =>
                quickNote.receivedViaCampfire
            )
              ? session.id
              : undefined
          }

          const reviewItems =
            await db.reviewItems
              .where('reviewDraftId')
              .equals(reviewDraft.id)
              .toArray()

          const pendingQuickNoteIds =
            new Set(
              reviewItems
                .filter(
                  (reviewItem) =>
                    !reviewItem.committedAt
                )
                .map(
                  (reviewItem) =>
                    reviewItem.quickNoteId
                )
            )

          return quickNotes.some(
            (quickNote) =>
              quickNote.receivedViaCampfire &&
              pendingQuickNoteIds.has(
                quickNote.id
              )
          )
            ? session.id
            : undefined
        }
      )
    )

  return campfireSessionIds.filter(
    (sessionId): sessionId is string =>
      Boolean(sessionId)
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

export async function getUncommittedReviewItems(
  reviewDraftId: string
) {
  const reviewItems =
    await getReviewItems(reviewDraftId)

  return reviewItems.filter(
    (reviewItem) =>
      !reviewItem.committedAt
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
        session.status !== 'reviewing' &&
        session.status !== 'completed'
      ) {
        throw new Error(
          'Only an ended Session can be reviewed.'
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

      const quickNotes =
        await getQuickNotesForSession(
          session.id
        )

      const existingReviewItems =
        await db.reviewItems
          .where('reviewDraftId')
          .equals(reviewDraft.id)
          .toArray()

      const representedQuickNoteIds =
        new Set(
          existingReviewItems.map(
            (item) => item.quickNoteId
          )
        )

      const missingQuickNotes =
        quickNotes.filter(
          (quickNote) =>
            !representedQuickNoteIds.has(
              quickNote.id
            )
        )

      if (
        session.status === 'completed' &&
        missingQuickNotes.length === 0
      ) {
        throw new Error(
          'This completed Session has no new Quick Notes to review.'
        )
      }

      if (missingQuickNotes.length > 0) {
        const timestamp =
          new Date().toISOString()

        const newReviewItems =
          missingQuickNotes.map(
            (quickNote) => ({
              id: createId(),
              reviewDraftId:
                reviewDraft.id,
              quickNoteId:
                quickNote.id,
              workingText:
                quickNote.text,
              isDiscarded: false,
              committedAt: undefined,
              createdAt: timestamp,
              updatedAt: timestamp,
            })
          )

        await db.reviewItems.bulkAdd(
          newReviewItems
        )

        if (
          !reviewDraft.currentReviewItemId
        ) {
          reviewDraft.currentReviewItemId =
            newReviewItems[0].id

          await db.reviewDrafts.update(
            reviewDraft.id,
            {
              currentReviewItemId:
                newReviewItems[0].id,
              updatedAt: timestamp,
            }
          )
        }

        if (session.status === 'completed') {
          reviewDraft.status = 'in_progress'
          reviewDraft.currentReviewItemId =
            newReviewItems[0].id

          await db.reviewDrafts.update(
            reviewDraft.id,
            {
              status: 'in_progress',
              currentReviewItemId:
                newReviewItems[0].id,
              updatedAt: timestamp,
            }
          )

          await db.sessions.update(
            session.id,
            {
              status: 'reviewing',
              updatedAt: timestamp,
            }
          )
        }
      }

      const reviewItems =
        await getUncommittedReviewItems(
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
    relationship: 'unknown' as const,
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
  const resolvedPersonId =
    await resolveEntityRedirect(
      'person',
      personId
    )

  return db.people.get(
    resolvedPersonId
  )
}

export async function resolveEntityRedirect(
  entityType: 'person' | 'discovery',
  entityId: string
) {
  let currentId = entityId

  const visited =
    new Set<string>()

  while (!visited.has(currentId)) {
    visited.add(currentId)

    const redirect =
      await db.entityRedirects
        .where('obsoleteId')
        .equals(currentId)
        .filter(
          (candidate) =>
            candidate.entityType ===
            entityType
        )
        .first()

    if (!redirect) {
      return currentId
    }

    currentId =
      redirect.survivorId
  }

  throw new Error(
    'Entity redirect cycle detected.'
  )
}

export async function mergePeople(
  survivorId: string,
  obsoleteId: string
) {
  if (survivorId === obsoleteId) {
    throw new Error(
      'A Person cannot be merged with itself.'
    )
  }

  const [
    survivor,
    obsolete,
  ] = await Promise.all([
    db.people.get(survivorId),
    db.people.get(obsoleteId),
  ])

  if (!survivor) {
    throw new Error(
      'Surviving Person not found.'
    )
  }

  if (!obsolete) {
    throw new Error(
      'Person to merge not found.'
    )
  }

  if (
    survivor.campaignId !==
    obsolete.campaignId
  ) {
    throw new Error(
      'People from different campaigns cannot be merged.'
    )
  }

  return db.transaction(
    'rw',
    [
      db.people,
      db.noteContributions,
      db.entityRedirects,
    ],
    async () => {
      const survivorContributions =
        await db.noteContributions
          .where('targetId')
          .equals(survivorId)
          .filter(
            (contribution) =>
              contribution.targetType ===
              'person'
          )
          .toArray()

      const obsoleteContributions =
        await db.noteContributions
          .where('targetId')
          .equals(obsoleteId)
          .filter(
            (contribution) =>
              contribution.targetType ===
              'person'
          )
          .toArray()

      const timestamp =
        new Date().toISOString()

      /*
       * Preserve older flat Notes that
       * predate contribution tracking.
       */
      if (
        survivorContributions.length ===
          0 &&
        survivor.notes.trim()
      ) {
        survivorContributions.push({
          id: createId(),
          campaignId:
            survivor.campaignId,
          targetType: 'person',
          targetId: survivorId,
          text: survivor.notes,
          createdAt:
            survivor.createdAt,
          updatedAt: timestamp,
        })

        await db.noteContributions.add(
          survivorContributions[
            survivorContributions.length -
              1
          ]
        )
      }

      if (
        obsoleteContributions.length ===
          0 &&
        obsolete.notes.trim()
      ) {
        obsoleteContributions.push({
          id: createId(),
          campaignId:
            obsolete.campaignId,
          targetType: 'person',
          targetId: obsoleteId,
          text: obsolete.notes,
          createdAt:
            obsolete.createdAt,
          updatedAt: timestamp,
        })

        await db.noteContributions.add(
          obsoleteContributions[
            obsoleteContributions.length -
              1
          ]
        )
      }

      for (
        const contribution
        of obsoleteContributions
      ) {
        await db.noteContributions.update(
          contribution.id,
          {
            targetId: survivorId,
            updatedAt: timestamp,
          }
        )
      }

      const combinedContributions = [
        ...survivorContributions,
        ...obsoleteContributions.map(
          (contribution) => ({
            ...contribution,
            targetId: survivorId,
          })
        ),
      ].sort((a, b) => {
        const timeComparison =
          a.createdAt.localeCompare(
            b.createdAt
          )

        if (timeComparison !== 0) {
          return timeComparison
        }

        return a.id.localeCompare(b.id)
      })

      const combinedNotes =
        combinedContributions
          .map(
            (contribution) =>
              contribution.text
          )
          .filter(Boolean)
          .join('\n')

      await db.people.update(
        survivorId,
        {
          notes: combinedNotes,
          updatedAt: timestamp,
        }
      )

      await db.entityRedirects.add({
        id: createId(),
        campaignId:
          survivor.campaignId,
        entityType: 'person',
        obsoleteId,
        survivorId,
        createdAt: timestamp,
      })

      await db.people.delete(
        obsoleteId
      )

      return db.people.get(
        survivorId
      )
    }
  )
}

export async function getNoteContributions(
  targetType: 'person' | 'discovery',
  targetId: string
) {
  const resolvedTargetId =
    await resolveEntityRedirect(
      targetType,
      targetId
    )

  const contributions =
    await db.noteContributions
      .where('targetId')
      .equals(resolvedTargetId)
      .filter(
        (contribution) =>
          contribution.targetType ===
          targetType
      )
      .toArray()

  return contributions.sort(
    (a, b) =>
      a.createdAt.localeCompare(
        b.createdAt
      )
  )
}

export async function updatePersonName(
  personId: string,
  name: string
) {
  const person =
    await db.people.get(personId)

  if (!person) {
    throw new Error(
      'Person not found.'
    )
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Person name cannot be empty.'
    )
  }

  await db.people.update(
    personId,
    {
      name: trimmedName,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.people.get(personId)
}

export async function deletePerson(
  personId: string
) {
  const person =
    await db.people.get(personId)

  if (!person) {
    throw new Error(
      'Person not found.'
    )
  }

  await db.transaction(
    'rw',
    [
      db.people,
      db.noteContributions,
      db.entityRedirects,
    ],
    async () => {
      const contributionIds =
        (
          await db.noteContributions
            .where('targetId')
            .equals(personId)
            .filter(
              (contribution) =>
                contribution.targetType ===
                'person'
            )
            .toArray()
        ).map(
          (contribution) =>
            contribution.id
        )

      if (
        contributionIds.length > 0
      ) {
        await db.noteContributions
          .where('id')
          .anyOf(contributionIds)
          .delete()
      }

      const redirects =
        await db.entityRedirects
          .filter(
            (redirect) =>
              redirect.entityType ===
                'person' &&
              (
                redirect.obsoleteId ===
                  personId ||
                redirect.survivorId ===
                  personId
              )
          )
          .toArray()

      const redirectIds =
        redirects.map(
          (redirect) =>
            redirect.id
        )

      if (redirectIds.length > 0) {
        await db.entityRedirects
          .where('id')
          .anyOf(redirectIds)
          .delete()
      }

      await db.people.delete(
        personId
      )
    }
  )
}

export async function updatePersonRelationship(
  personId: string,
  relationship:
    | 'unknown'
    | 'stranger'
    | 'ally'
    | 'neutral'
    | 'rival'
    | 'foe'
) {
  const person =
    await db.people.get(personId)

  if (!person) {
    throw new Error(
      'Person not found.'
    )
  }

  await db.people.update(
    personId,
    {
      relationship,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.people.get(personId)
}

export async function updatePersonNotes(
  personId: string,
  notes: string
) {
  const person =
    await db.people.get(personId)

  if (!person) {
    throw new Error(
      'Person not found.'
    )
  }

  if (person.notes === notes) {
    return person
  }

  return db.transaction(
    'rw',
    [
      db.people,
      db.noteContributions,
    ],
    async () => {
      const contributions =
        (
          await db.noteContributions
            .where('targetId')
            .equals(personId)
            .filter(
              (contribution) =>
                contribution.targetType ===
                'person'
            )
            .toArray()
        ).sort(
          (a, b) =>
            a.createdAt.localeCompare(
              b.createdAt
            )
        )

      const timestamp =
        new Date().toISOString()

      /*
       * Emptying the Notes area removes
       * the existing contributions.
       */
      if (!notes.trim()) {
        const contributionIds =
          contributions.map(
            (contribution) =>
              contribution.id
          )

        if (
          contributionIds.length > 0
        ) {
          await db.noteContributions
            .where('id')
            .anyOf(
              contributionIds
            )
            .delete()
        }

        await db.people.update(
          personId,
          {
            notes: '',
            updatedAt: timestamp,
          }
        )

        return db.people.get(
          personId
        )
      }

      /*
       * No contribution history yet:
       * create one manual contribution.
       */
      if (
        contributions.length === 0
      ) {
        await db.noteContributions.add({
          id: createId(),
          campaignId:
            person.campaignId,
          targetType: 'person',
          targetId: personId,
          text: notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        await db.people.update(
          personId,
          {
            notes,
            updatedAt: timestamp,
          }
        )

        return db.people.get(
          personId
        )
      }

      /*
       * Straightforward text added at
       * the end becomes a new manual
       * contribution.
       */
      if (
        notes.startsWith(
          person.notes
        )
      ) {
        const addedText =
          notes
            .slice(
              person.notes.length
            )
            .replace(/^\n+/, '')

        if (addedText.trim()) {
          await db.noteContributions.add({
            id: createId(),
            campaignId:
              person.campaignId,
            targetType: 'person',
            targetId: personId,
            text: addedText,
            createdAt: timestamp,
            updatedAt: timestamp,
          })

          await db.people.update(
            personId,
            {
              notes,
              updatedAt: timestamp,
            }
          )

          return db.people.get(
            personId
          )
        }
      }

      /*
       * Work out where each existing
       * contribution appears in the
       * assembled Notes text.
       */
      const spans: Array<{
        id: string
        start: number
        end: number
      }> = []

      let searchFrom = 0
      let spansAreValid = true

      for (
        const contribution
        of contributions
      ) {
        const start =
          person.notes.indexOf(
            contribution.text,
            searchFrom
          )

        if (start < 0) {
          spansAreValid = false
          break
        }

        const end =
          start +
          contribution.text.length

        spans.push({
          id: contribution.id,
          start,
          end,
        })

        searchFrom = end
      }

      if (spansAreValid) {
        let prefixLength = 0

        while (
          prefixLength <
            person.notes.length &&
          prefixLength <
            notes.length &&
          person.notes[
            prefixLength
          ] === notes[prefixLength]
        ) {
          prefixLength += 1
        }

        let suffixLength = 0

        while (
          suffixLength <
            person.notes.length -
              prefixLength &&
          suffixLength <
            notes.length -
              prefixLength &&
          person.notes[
            person.notes.length -
              1 -
              suffixLength
          ] ===
            notes[
              notes.length -
                1 -
                suffixLength
            ]
        ) {
          suffixLength += 1
        }

        const oldChangeEnd =
          person.notes.length -
          suffixLength

        const changedSpan =
          spans.find(
            (span) =>
              prefixLength >=
                span.start &&
              oldChangeEnd <=
                span.end
          )

        if (changedSpan) {
          const beforeChange =
            person.notes.slice(
              changedSpan.start,
              prefixLength
            )

          const changedText =
            notes.slice(
              prefixLength,
              notes.length -
                suffixLength
            )

          const afterChange =
            person.notes.slice(
              oldChangeEnd,
              changedSpan.end
            )

          const nextContributionText =
            beforeChange +
            changedText +
            afterChange

          if (
            nextContributionText.trim()
          ) {
            await db.noteContributions.update(
              changedSpan.id,
              {
                text:
                  nextContributionText,
                updatedAt: timestamp,
              }
            )
          } else {
            await db.noteContributions.delete(
              changedSpan.id
            )
          }

          await db.people.update(
            personId,
            {
              notes,
              updatedAt: timestamp,
            }
          )

          return db.people.get(
            personId
          )
        }
      }

      /*
       * The edit crossed contribution
       * boundaries. Replace the affected
       * history with one consolidated
       * manual contribution.
       */
      const contributionIds =
        contributions.map(
          (contribution) =>
            contribution.id
        )

      await db.noteContributions
        .where('id')
        .anyOf(contributionIds)
        .delete()

      await db.noteContributions.add({
        id: createId(),
        campaignId:
          person.campaignId,
        targetType: 'person',
        targetId: personId,
        text: notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      await db.people.update(
        personId,
        {
          notes,
          updatedAt: timestamp,
        }
      )

      return db.people.get(
        personId
      )
    }
  )
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
  return db.transaction(
    'rw',
    [
      db.campaigns,
      db.discoveryCategories,
    ],
    async () => {
      const existingCategories =
        await db.discoveryCategories
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      if (
        existingCategories.length > 0
      ) {
        return existingCategories.sort(
          (a, b) =>
            a.sortPosition -
            b.sortPosition
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
  )
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

export async function createDiscoveryCategory(
  campaignId: string,
  name: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Category name is required.'
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

  const existingCategories =
    await db.discoveryCategories
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  const nextSortPosition =
    existingCategories.length === 0
      ? 0
      : Math.max(
          ...existingCategories.map(
            (category) =>
              category.sortPosition
          )
        ) + 1

  const timestamp =
    new Date().toISOString()

  const category = {
    id: createId(),
    campaignId,
    name: trimmedName,
    sortPosition:
      nextSortPosition,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.discoveryCategories.add(
    category
  )

  return category
}

export async function renameDiscoveryCategory(
  categoryId: string,
  name: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Category name is required.'
    )
  }

  const category =
    await db.discoveryCategories.get(
      categoryId
    )

  if (!category) {
    throw new Error(
      'Category not found.'
    )
  }

  await db.discoveryCategories.update(
    categoryId,
    {
      name: trimmedName,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.discoveryCategories.get(
    categoryId
  )
}

export async function getDiscoveryCategoryUsage(
  categoryId: string
) {
  const category =
    await db.discoveryCategories.get(
      categoryId
    )

  if (!category) {
    throw new Error(
      'Category not found.'
    )
  }

  const permanentDiscoveries =
    await db.discoveries
      .where('campaignId')
      .equals(category.campaignId)
      .filter(
        (discovery) =>
          discovery.categoryId ===
          categoryId
      )
      .count()

  const matchingReviewDiscoveries =
  await db.reviewDraftDiscoveries
    .filter(
      (discovery) =>
        discovery.categoryRef ===
        categoryId
    )
    .toArray()

  const reviewDraftIds =
    Array.from(
      new Set(
        matchingReviewDiscoveries.map(
          (discovery) =>
            discovery.reviewDraftId
        )
      )
    )

  const reviewDrafts =
    await db.reviewDrafts.bulkGet(
      reviewDraftIds
    )

  const openReviewDraftIds =
    new Set(
      reviewDrafts
        .filter(
          (reviewDraft) =>
            reviewDraft?.status ===
            'in_progress'
        )
        .map(
          (reviewDraft) =>
            reviewDraft!.id
        )
    )

  const reviewDraftDiscoveries =
    matchingReviewDiscoveries.filter(
      (discovery) =>
        openReviewDraftIds.has(
          discovery.reviewDraftId
        )
    ).length

  return {
    permanentDiscoveries,
    reviewDraftDiscoveries,
    total:
      permanentDiscoveries +
      reviewDraftDiscoveries,
  }
}

export async function deleteDiscoveryCategory(
  categoryId: string
) {
  const category =
    await db.discoveryCategories.get(
      categoryId
    )

  if (!category) {
    throw new Error(
      'Category not found.'
    )
  }

  const usage =
    await getDiscoveryCategoryUsage(
      categoryId
    )

  if (
    usage.permanentDiscoveries > 0 ||
    usage.reviewDraftDiscoveries > 0
  ) {
    throw new Error(
      'Category is still in use.'
    )
  }

  await db.discoveryCategories.delete(
    categoryId
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

export async function updateDiscoveryTitle(
  discoveryId: string,
  title: string
) {
  const discovery =
    await db.discoveries.get(
      discoveryId
    )

  if (!discovery) {
    throw new Error(
      'Discovery not found.'
    )
  }

  const trimmedTitle =
    title.trim()

  if (!trimmedTitle) {
    throw new Error(
      'Discovery title cannot be empty.'
    )
  }

  await db.discoveries.update(
    discoveryId,
    {
      title: trimmedTitle,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.discoveries.get(
    discoveryId
  )
}

export async function updateDiscoveryCategory(
  discoveryId: string,
  categoryId: string
) {
  const discovery =
    await db.discoveries.get(
      discoveryId
    )

  if (!discovery) {
    throw new Error(
      'Discovery not found.'
    )
  }

  const category =
    await db.discoveryCategories.get(
      categoryId
    )

  if (!category) {
    throw new Error(
      'Category not found.'
    )
  }

  if (
    category.campaignId !==
    discovery.campaignId
  ) {
    throw new Error(
      'Category belongs to another campaign.'
    )
  }

  await db.discoveries.update(
    discoveryId,
    {
      categoryId,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.discoveries.get(
    discoveryId
  )
}

export async function deleteDiscovery(
  discoveryId: string
) {
  const discovery =
    await db.discoveries.get(
      discoveryId
    )

  if (!discovery) {
    throw new Error(
      'Discovery not found.'
    )
  }

  await db.transaction(
    'rw',
    [
      db.discoveries,
      db.noteContributions,
      db.entityRedirects,
    ],
    async () => {
      const contributionIds =
        (
          await db.noteContributions
            .where('targetId')
            .equals(discoveryId)
            .filter(
              (contribution) =>
                contribution.targetType ===
                'discovery'
            )
            .toArray()
        ).map(
          (contribution) =>
            contribution.id
        )

      if (
        contributionIds.length > 0
      ) {
        await db.noteContributions
          .where('id')
          .anyOf(contributionIds)
          .delete()
      }

      const redirects =
        await db.entityRedirects
          .filter(
            (redirect) =>
              redirect.entityType ===
                'discovery' &&
              (
                redirect.obsoleteId ===
                  discoveryId ||
                redirect.survivorId ===
                  discoveryId
              )
          )
          .toArray()

      const redirectIds =
        redirects.map(
          (redirect) =>
            redirect.id
        )

      if (
        redirectIds.length > 0
      ) {
        await db.entityRedirects
          .where('id')
          .anyOf(redirectIds)
          .delete()
      }

      await db.discoveries.delete(
        discoveryId
      )
    }
  )
}

export async function updateDiscoveryNotes(
  discoveryId: string,
  notes: string
) {
  const discovery =
    await db.discoveries.get(
      discoveryId
    )

  if (!discovery) {
    throw new Error(
      'Discovery not found.'
    )
  }

  if (
    discovery.notes === notes
  ) {
    return discovery
  }

  return db.transaction(
    'rw',
    [
      db.discoveries,
      db.noteContributions,
    ],
    async () => {
      const contributions =
        (
          await db.noteContributions
            .where('targetId')
            .equals(discoveryId)
            .filter(
              (contribution) =>
                contribution.targetType ===
                'discovery'
            )
            .toArray()
        ).sort(
          (a, b) =>
            a.createdAt.localeCompare(
              b.createdAt
            )
        )

      const timestamp =
        new Date().toISOString()

      /*
       * Same V1 behaviour as People:
       * editing the visible combined Notes
       * consolidates the existing contribution
       * history into one manual contribution.
       */
      if (
        contributions.length > 0
      ) {
        const contributionIds =
          contributions.map(
            (contribution) =>
              contribution.id
          )

        await db.noteContributions
          .where('id')
          .anyOf(
            contributionIds
          )
          .delete()
      }

      if (notes.trim()) {
        await db.noteContributions.add({
          id: createId(),
          campaignId:
            discovery.campaignId,
          targetType:
            'discovery',
          targetId:
            discoveryId,
          text: notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }

      await db.discoveries.update(
        discoveryId,
        {
          notes,
          updatedAt: timestamp,
        }
      )

      return db.discoveries.get(
        discoveryId
      )
    }
  )
}

export async function mergeDiscoveries(
  survivorId: string,
  obsoleteId: string
) {
  if (
    survivorId === obsoleteId
  ) {
    throw new Error(
      'Cannot merge a Discovery into itself.'
    )
  }

  const [
    survivor,
    obsolete,
  ] = await Promise.all([
    db.discoveries.get(
      survivorId
    ),
    db.discoveries.get(
      obsoleteId
    ),
  ])

  if (!survivor) {
    throw new Error(
      'Surviving Discovery not found.'
    )
  }

  if (!obsolete) {
    throw new Error(
      'Discovery to merge not found.'
    )
  }

  if (
    survivor.campaignId !==
    obsolete.campaignId
  ) {
    throw new Error(
      'Discoveries belong to different Campaigns.'
    )
  }

  return db.transaction(
    'rw',
    [
      db.discoveries,
      db.noteContributions,
      db.entityRedirects,
    ],
    async () => {
      const [
        survivorContributions,
        obsoleteContributions,
      ] = await Promise.all([
        db.noteContributions
          .where('targetId')
          .equals(survivorId)
          .filter(
            (contribution) =>
              contribution.targetType ===
                'discovery'
          )
          .toArray(),

        db.noteContributions
          .where('targetId')
          .equals(obsoleteId)
          .filter(
            (contribution) =>
              contribution.targetType ===
                'discovery'
          )
          .toArray(),
      ])

      const timestamp =
        new Date().toISOString()

      /*
       * Preserve legacy flat Notes
       * if an older Discovery has no
       * contribution records yet.
       */
      if (
        survivor.notes &&
        survivorContributions.length ===
          0
      ) {
        const contribution = {
          id: createId(),
          campaignId:
            survivor.campaignId,
          targetType:
            'discovery' as const,
          targetId: survivorId,
          text: survivor.notes,
          createdAt:
            survivor.createdAt,
          updatedAt:
            survivor.updatedAt,
        }

        await db.noteContributions.add(
          contribution
        )

        survivorContributions.push(
          contribution
        )
      }

      if (
        obsolete.notes &&
        obsoleteContributions.length ===
          0
      ) {
        const contribution = {
          id: createId(),
          campaignId:
            obsolete.campaignId,
          targetType:
            'discovery' as const,
          targetId: obsoleteId,
          text: obsolete.notes,
          createdAt:
            obsolete.createdAt,
          updatedAt:
            obsolete.updatedAt,
        }

        await db.noteContributions.add(
          contribution
        )

        obsoleteContributions.push(
          contribution
        )
      }

      for (
        const contribution of
        obsoleteContributions
      ) {
        await db.noteContributions.update(
          contribution.id,
          {
            targetId: survivorId,
          }
        )
      }

      const combinedContributions = [
        ...survivorContributions,
        ...obsoleteContributions.map(
          (contribution) => ({
            ...contribution,
            targetId: survivorId,
          })
        ),
      ].sort((a, b) => {
        const timeComparison =
          a.createdAt.localeCompare(
            b.createdAt
          )

        if (
          timeComparison !== 0
        ) {
          return timeComparison
        }

        return a.id.localeCompare(
          b.id
        )
      })

      const combinedNotes =
        combinedContributions
          .map(
            (contribution) =>
              contribution.text
          )
          .filter(Boolean)
          .join('\n')

      await db.discoveries.update(
        survivorId,
        {
          notes: combinedNotes,
          updatedAt: timestamp,
        }
      )

      await db.entityRedirects.add({
        id: createId(),
        campaignId:
          survivor.campaignId,
        entityType:
          'discovery',
        obsoleteId,
        survivorId,
        createdAt: timestamp,
      })

      await db.discoveries.delete(
        obsoleteId
      )

      return db.discoveries.get(
        survivorId
      )
    }
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
    await getUncommittedReviewItems(
      reviewDraftId
    )

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
      await getUncommittedReviewItems(
        reviewDraftId
      )

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
      db.quickNotes,
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

      const allReviewItems =
        await getReviewItems(
          reviewDraft.id
        )

      const reviewItems =
        allReviewItems.filter(
          (item) => !item.committedAt
        )

      if (reviewItems.length === 0) {
        throw new Error(
          'No uncommitted Review Items remain.'
        )
      }

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
          relationship: 'unknown' as const,
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
        reviewItems
          .flatMap((reviewItem) =>
            committedDestinations.filter(
              (destination) =>
                destination.reviewItemId ===
                  reviewItem.id &&
                destination.destinationType ===
                  'journal'
            )
          )
          .map(
            (destination) =>
              destination.text.trim()
          )
          .filter(Boolean)

      const journalText =
        journalTexts.join('\n\n')

      const existingJournalText =
        session.journalText.trim()

      const newJournalText =
        journalText.trim()

      const combinedJournalText = [
        existingJournalText,
        newJournalText,
      ]
        .filter(Boolean)
        .join('\n\n')

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
          journalText: combinedJournalText,
          reviewCompletedAt:
            timestamp,
          updatedAt: timestamp,
        }
      )

      if (reviewItemIds.length > 0) {
        await db.reviewItems
          .where('id')
          .anyOf(reviewItemIds)
          .modify((reviewItem) => {
            reviewItem.committedAt =
              reviewItem.committedAt ??
              timestamp
          })
      }

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
  const resolvedTargetId =
    await resolveEntityRedirect(
      targetType,
      targetId
    )

  const contributions =
    await db.noteContributions
      .where('targetId')
      .equals(resolvedTargetId)
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

export async function updateSessionJournalText(
  sessionId: string,
  journalText: string
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
      journalText,
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

export async function getCampfireShareableSessions(
  campaignId: string
) {
  const sessions =
    await db.sessions
      .where('campaignId')
      .equals(campaignId)
      .filter(
        (session) =>
          session.status !== 'active'
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
    xpToNextLevel: null,

    title: '',
    alignment: '',
    background: '',
    deity: '',

    strength: {
      score: null,
    },

    dexterity: {
      score: null,
    },

    constitution: {
      score: null,
    },

    intelligence: {
      score: null,
    },

    wisdom: {
      score: null,
    },

    charisma: {
      score: null,
    },

    currentHp: null,
    maxHp: null,
    armorClass: null,

    attacks: '',
    talentsAndSpells: '',

    gear: Array(20).fill(''),
    maxGearCapacity: null,
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

export async function getEquipmentItems(
  characterId: string
) {
  const items =
    await db.equipmentItems
      .where('characterId')
      .equals(characterId)
      .toArray()

  return items.sort(
    (a, b) =>
      a.sortPosition -
      b.sortPosition
  )
}

export async function createEquipmentItem(
  campaignId: string,
  characterId: string,
  sortPosition: number,
  name: string
) {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      'Equipment name is required.'
    )
  }

  const character =
    await db.characters.get(characterId)

  if (!character) {
    throw new Error(
      'Character not found.'
    )
  }

  if (
    character.campaignId !== campaignId
  ) {
    throw new Error(
      'Character does not belong to this campaign.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const item = {
    id: createId(),
    campaignId,
    characterId,

    name: trimmedName,
    type: 'gear' as const,

    quantity: '1',
    gearSlots: 0,
    costValue: '',
    description: '',

    damage: '',
    weaponType: '',
    range: '',
    properties: '',
    armorClass: '',

    sortPosition,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.equipmentItems.add(item)

  return item
}

export async function updateEquipmentItem(
  equipmentItemId: string,
  changes: {
    name?: string
    type?: import('./database').EquipmentType
    quantity?: string
    gearSlots?: number
    costValue?: string
    description?: string
    damage?: string
    range?: string
    properties?: string
    armorClass?: string
    weaponType?: string
    sortPosition?: number
  }
) {
  const item =
    await db.equipmentItems.get(
      equipmentItemId
    )

  if (!item) {
    throw new Error(
      'Equipment item not found.'
    )
  }

  if (
    changes.name !== undefined &&
    !changes.name.trim()
  ) {
    throw new Error(
      'Equipment name is required.'
    )
  }

  await db.equipmentItems.update(
    equipmentItemId,
    {
      ...changes,
      ...(changes.name !== undefined
        ? {
            name: changes.name.trim(),
          }
        : {}),
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.equipmentItems.get(
    equipmentItemId
  )
}

export async function deleteEquipmentItem(
  equipmentItemId: string
) {
  await db.equipmentItems.delete(
    equipmentItemId
  )
}

/*
 * CHARACTER MODULES
 */

export async function getCharacterModules(
  campaignId: string
) {
  const modules =
    await db.characterModules
      .where('campaignId')
      .equals(campaignId)
      .toArray()

  return modules.sort(
    (a, b) =>
      a.sortPosition -
      b.sortPosition
  )
}

export async function createCharacterModule(
  campaignId: string,
  characterId: string,
  moduleType:
    import('./database').CharacterModuleType,
  title: string
) {
  const character =
    await db.characters.get(characterId)

  if (!character) {
    throw new Error(
      'Character not found.'
    )
  }

  if (
    character.campaignId !== campaignId
  ) {
    throw new Error(
      'Character does not belong to this campaign.'
    )
  }

  const existingModule =
    await db.characterModules
      .where('characterId')
      .equals(characterId)
      .filter(
        (module) =>
          module.moduleType === moduleType
      )
      .first()

  if (existingModule) {
    return existingModule
  }

  const existingModules =
    await getCharacterModules(campaignId)

  const highestSortPosition =
    existingModules.reduce(
      (highest, module) =>
        Math.max(
          highest,
          module.sortPosition
        ),
      -1
    )

  const timestamp =
    new Date().toISOString()

  const module = {
    id: createId(),
    campaignId,
    characterId,
    moduleType,
    title,
    sortPosition:
      highestSortPosition + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.characterModules.add(module)

  return module
}

export async function deleteCharacterModule(
  characterModuleId: string
) {
  const module =
    await db.characterModules.get(
      characterModuleId
    )

  if (!module) {
    return
  }

  if (module.moduleType === 'companion') {
    await deleteCompanionModule(
      characterModuleId
    )

    return
  }

  if (module.moduleType === 'weather') {
    await deleteWeatherModule(
      characterModuleId
    )

    return
  }

  throw new Error(
    `Unsupported character module type: ${module.moduleType}`
  )
}

/*
 * COMPANION MODULE
 */

export async function getCompanionModule(
  characterId: string
) {
  return db.characterModules
    .where('characterId')
    .equals(characterId)
    .filter(
      (module) =>
        module.moduleType === 'companion'
    )
    .first()
}

export async function createCompanionModule(
  campaignId: string,
  characterId: string
) {
  const existingModule =
    await getCompanionModule(characterId)

  if (existingModule) {
    return existingModule
  }

  const character =
    await db.characters.get(characterId)

  if (!character) {
    throw new Error(
      'Character not found.'
    )
  }

  if (
    character.campaignId !== campaignId
  ) {
    throw new Error(
      'Character does not belong to this campaign.'
    )
  }

  const timestamp =
    new Date().toISOString()

  const existingModules =
    await getCharacterModules(campaignId)

  const highestSortPosition =
    existingModules.reduce(
      (highest, module) =>
        Math.max(
          highest,
          module.sortPosition
        ),
      -1
    )

  const module = {
    id: createId(),
    campaignId,
    characterId,

    moduleType: 'companion' as const,
    title: 'Companion',
    sortPosition:
      highestSortPosition + 1,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const moduleData = {
    characterModuleId: module.id,

    name: '',
    description: '',
    relationship: 'wary' as const,
    hunger: 'full' as const,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.transaction(
    'rw',
    [
      db.characterModules,
      db.companionModuleData,
    ],
    async () => {
      await db.characterModules.add(
        module
      )

      await db.companionModuleData.add(
        moduleData
      )
    }
  )

  return module
}

export async function getCompanionModuleData(
  characterModuleId: string
) {
  return db.companionModuleData.get(
    characterModuleId
  )
}

export async function updateCompanionModuleData(
  characterModuleId: string,
  changes: {
    name?: string
    description?: string
    relationship?:
      import('./database').CompanionRelationship
    hunger?:
      import('./database').CompanionHunger
  }
) {
  const moduleData =
    await db.companionModuleData.get(
      characterModuleId
    )

  if (!moduleData) {
    throw new Error(
      'Companion module data not found.'
    )
  }

  await db.companionModuleData.update(
    characterModuleId,
    {
      ...changes,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.companionModuleData.get(
    characterModuleId
  )
}

export async function getCompanionAbilities(
  characterModuleId: string
) {
  const abilities =
    await db.companionAbilities
      .where('characterModuleId')
      .equals(characterModuleId)
      .toArray()

  return abilities.sort(
    (a, b) =>
      a.sortPosition -
      b.sortPosition
  )
}

export async function addCompanionAbility(
  characterModuleId: string
) {
  const module =
    await db.characterModules.get(
      characterModuleId
    )

  if (!module) {
    throw new Error(
      'Character module not found.'
    )
  }

  const existingAbilities =
    await getCompanionAbilities(
      characterModuleId
    )

  const timestamp =
    new Date().toISOString()

  const ability = {
    id: createId(),
    characterModuleId,

    name: '',
    description: '',
    sortPosition:
      existingAbilities.length,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.companionAbilities.add(
    ability
  )

  return ability
}

export async function updateCompanionAbility(
  abilityId: string,
  changes: {
    name?: string
    description?: string
    sortPosition?: number
  }
) {
  const ability =
    await db.companionAbilities.get(
      abilityId
    )

  if (!ability) {
    throw new Error(
      'Companion ability not found.'
    )
  }

  await db.companionAbilities.update(
    abilityId,
    {
      ...changes,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.companionAbilities.get(
    abilityId
  )
}

export async function deleteCompanionAbility(
  abilityId: string
) {
  await db.companionAbilities.delete(
    abilityId
  )
}

export async function deleteCompanionModule(
  characterModuleId: string
) {
  return db.transaction(
    'rw',
    [
      db.characterModules,
      db.companionModuleData,
      db.companionAbilities,
    ],
    async () => {
      await db.companionAbilities
        .where('characterModuleId')
        .equals(characterModuleId)
        .delete()

      await db.companionModuleData.delete(
        characterModuleId
      )

      await db.characterModules.delete(
        characterModuleId
      )
    }
  )
}

/*
 * WEATHER MODULE
 */

export async function getWeatherModule(
  characterId: string
) {
  return db.characterModules
    .where('characterId')
    .equals(characterId)
    .filter(
      (module) =>
        module.moduleType === 'weather'
    )
    .first()
}

export async function getOrCreateWeatherModuleData(
  characterModuleId: string
) {
  const module =
    await db.characterModules.get(
      characterModuleId
    )

  if (!module) {
    throw new Error(
      'Character module not found.'
    )
  }

  if (module.moduleType !== 'weather') {
    throw new Error(
      'Character module is not a Weather module.'
    )
  }

  let moduleData =
    await db.weatherModuleData.get(
      characterModuleId
    )

  if (!moduleData) {
    const timestamp =
      new Date().toISOString()

    moduleData = {
      characterModuleId,

      currentSeason: undefined,
      currentHexId: undefined,

      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.weatherModuleData.add(
      moduleData
    )
  }

  return moduleData
}

export async function updateWeatherModuleData(
  characterModuleId: string,
  changes: {
    currentSeason?:
      import('./database').WeatherSeason
    currentHexId?: string
  }
) {
  const moduleData =
    await db.weatherModuleData.get(
      characterModuleId
    )

  if (!moduleData) {
    throw new Error(
      'Weather module data not found.'
    )
  }

  await db.weatherModuleData.update(
    characterModuleId,
    {
      ...changes,
      updatedAt:
        new Date().toISOString(),
    }
  )

  return db.weatherModuleData.get(
    characterModuleId
  )
}

export async function deleteWeatherModule(
  characterModuleId: string
) {
  return db.transaction(
    'rw',
    [
      db.characterModules,
      db.weatherModuleData,
    ],
    async () => {
      await db.weatherModuleData.delete(
        characterModuleId
      )

      await db.characterModules.delete(
        characterModuleId
      )
    }
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
    pinnedToToday: false,

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
    pinnedToToday?: boolean
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
    pinnedToToday: false,

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
    pinnedToToday?: boolean
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
    equipmentItems,
    characterModules,
    goals,
    reminders,
    sessions,
    quickNotes,
    people,
    discoveryCategories,
    discoveries,
    reviewDrafts,
    noteContributions,
    entityRedirects,
  ] = await Promise.all([
    db.characters
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.equipmentItems
      .where('campaignId')
      .equals(campaignId)
      .toArray(),

    db.characterModules
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

    db.entityRedirects
      .where('campaignId')
      .equals(campaignId)
      .toArray(),
  ])

const characterModuleIds =
  characterModules.map(
    (module) => module.id
  )

const [
  companionModuleData,
  companionAbilities,
  weatherModuleData,
] =
  characterModuleIds.length > 0
    ? await Promise.all([
        db.companionModuleData
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .toArray(),

        db.companionAbilities
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .toArray(),

        db.weatherModuleData
          .where('characterModuleId')
          .anyOf(characterModuleIds)
          .toArray(),
      ])
    : [[], [], []]

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
      equipmentItems,
      characterModules,
      companionModuleData,
      companionAbilities,
      weatherModuleData,
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
      entityRedirects,
    },
  }
}

function normalizeBackupQuickNotes(
  quickNotes: any[] | undefined
) {
  return (quickNotes ?? []).map(
    (quickNote) => ({
      ...quickNote,

      shareId:
        quickNote.shareId ??
        quickNote.id,

      receivedViaCampfire:
        quickNote.receivedViaCampfire ??
        false,
    })
  )
}

function normalizeBackupModuleData(
  data: any
) {
  const characterModules =
    (data.characterModules ?? []).map(
      (module: any) => {
        if (
          module.moduleType !== 'ferret'
        ) {
          return module
        }

        return {
          ...module,
          moduleType: 'companion',
          title:
            module.title === 'Ferret'
              ? 'Companion'
              : module.title,
        }
      }
    )

  const companionModuleData =
    data.companionModuleData ??
    data.ferretModuleData ??
    []

  const companionAbilities =
    data.companionAbilities ??
    data.ferretAbilities ??
    []

  const weatherModuleData =
    data.weatherModuleData ?? []

  return {
    characterModules,
    companionModuleData,
    companionAbilities,
    weatherModuleData,
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

  const normalizedQuickNotes =
    normalizeBackupQuickNotes(
      data.quickNotes
    )

  const normalizedModuleData =
    normalizeBackupModuleData(data)

  await db.transaction(
    'rw',
    [
      db.campaigns,
      db.characters,
      db.equipmentItems,
      db.characterModules,
      db.companionModuleData,
      db.companionAbilities,
      db.weatherModuleData,
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
      db.entityRedirects,
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

      if (data.equipmentItems?.length) {
        await db.equipmentItems.bulkAdd(
          data.equipmentItems
        )
      }

      if (
        normalizedModuleData
          .characterModules.length
      ) {
        await db.characterModules.bulkAdd(
          normalizedModuleData.characterModules
        )
      }

      if (
        normalizedModuleData
          .companionModuleData.length
      ) {
        await db.companionModuleData.bulkAdd(
          normalizedModuleData
            .companionModuleData
        )
      }

      if (
        normalizedModuleData
          .companionAbilities.length
      ) {
        await db.companionAbilities.bulkAdd(
          normalizedModuleData
            .companionAbilities
        )
      }

      if (
        normalizedModuleData
          .weatherModuleData.length
      ) {
        await db.weatherModuleData.bulkAdd(
          normalizedModuleData
            .weatherModuleData
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

      if (normalizedQuickNotes.length) {
        await db.quickNotes.bulkAdd(
          normalizedQuickNotes
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

      if (
        data.entityRedirects?.length
      ) {
        await db.entityRedirects.bulkAdd(
          data.entityRedirects
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

  const normalizedQuickNotes =
    normalizeBackupQuickNotes(
      data.quickNotes
    )

  const normalizedModuleData =
    normalizeBackupModuleData(data)

  await db.transaction(
    'rw',
    [
      db.campaigns,
      db.characters,
      db.equipmentItems,
      db.characterModules,
      db.companionModuleData,
      db.companionAbilities,
      db.weatherModuleData,
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
      db.entityRedirects,
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

      await db.entityRedirects
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

      const existingCharacterModules =
        await db.characterModules
          .where('campaignId')
          .equals(campaignId)
          .toArray()

      const existingCharacterModuleIds =
        existingCharacterModules.map(
          (module) => module.id
        )

      if (existingCharacterModuleIds.length > 0) {
        await db.companionAbilities
          .where('characterModuleId')
          .anyOf(existingCharacterModuleIds)
          .delete()

        await db.companionModuleData
          .where('characterModuleId')
          .anyOf(existingCharacterModuleIds)
          .delete()

        await db.weatherModuleData
          .where('characterModuleId')
          .anyOf(existingCharacterModuleIds)
          .delete()

        await db.characterModules
          .where('id')
          .anyOf(existingCharacterModuleIds)
          .delete()
      }

      await db.equipmentItems
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

      if (data.equipmentItems?.length) {
        await db.equipmentItems.bulkAdd(
          data.equipmentItems
        )
      }

      if (
        normalizedModuleData
          .characterModules.length
      ) {
        await db.characterModules.bulkAdd(
          normalizedModuleData.characterModules
        )
      }

      if (
        normalizedModuleData
          .companionModuleData.length
      ) {
        await db.companionModuleData.bulkAdd(
          normalizedModuleData
            .companionModuleData
        )
      }

      if (
        normalizedModuleData
          .companionAbilities.length
      ) {
        await db.companionAbilities.bulkAdd(
          normalizedModuleData
            .companionAbilities
        )
      }

      if (
        normalizedModuleData
          .weatherModuleData.length
      ) {
        await db.weatherModuleData.bulkAdd(
          normalizedModuleData
            .weatherModuleData
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

      if (normalizedQuickNotes.length) {
        await db.quickNotes.bulkAdd(
          normalizedQuickNotes
        )
      }

      if (data.people?.length) {
        await db.people.bulkAdd(
          data.people
        )
      }

      if (
        data.discoveryCategories?.length
      ) {
        await db.discoveryCategories.bulkAdd(
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
        data.reviewDraftPeople?.length
      ) {
        await db.reviewDraftPeople.bulkAdd(
            data.reviewDraftPeople
          )
      }

      if (
        data.reviewDraftCategories?.length
      ) {
        await db.reviewDraftCategories.bulkAdd(
            data.reviewDraftCategories
          )
      }

      if (
        data.reviewDraftDiscoveries?.length
      ) {
        await db.reviewDraftDiscoveries.bulkAdd(
            data.reviewDraftDiscoveries
          )
      }

      if (
        data.reviewDestinations?.length
      ) {
        await db.reviewDestinations.bulkAdd(
            data.reviewDestinations
          )
      }

      if (
        data.noteContributions?.length
      ) {
        await db.noteContributions.bulkAdd(
            data.noteContributions
          )
      }

      if (
        data.entityRedirects?.length
      ) {
        await db.entityRedirects.bulkAdd(
          data.entityRedirects
        )
      }
    }
  )

  return backup.campaign
}