import { useEffect, useState } from 'react'
import './App.css'

import {
  addJournalDestination,
  createCampaign,
  createQuickNote,
  endSession,
  getActiveSession,
  getCampaign,
  getOpenReviews,
  getQuickNotesForSession,
  getReviewDestinations,
  removeReviewDestination,
  setCurrentReviewItem,
  startOrResumeReview,
  startSession,
  updateReviewDestinationText,
  updateReviewItemText,
} from './data/repository'

import type {
  Campaign,
  QuickNote,
  ReviewDestination,
  ReviewDraft,
  ReviewItem,
  Session,
} from './data/database'

type Section =
  | 'today'
  | 'character'
  | 'ferret'
  | 'goals'
  | 'people'
  | 'discoveries'
  | 'journal'
  | 'reminders'
  | 'guide'

const sections: { id: Section; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'character', label: 'Character' },
  { id: 'ferret', label: 'Ferret' },
  { id: 'goals', label: 'Goals' },
  { id: 'people', label: 'People' },
  { id: 'discoveries', label: 'Discoveries' },
  { id: 'journal', label: 'Journal' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'guide', label: 'Guide' },
]

function QuickNoteModal({
  session,
  onClose,
  onSaved,
}: {
  session: Session
  onClose: () => void
  onSaved: (quickNote: QuickNote) => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setError('')

    if (!text.trim()) {
      setError('Quick Note text is required.')
      return
    }

    try {
      setIsSaving(true)

      const quickNote = await createQuickNote(
        session.campaignId,
        session.id,
        text
      )

      onSaved(quickNote)
    } catch (err) {
      console.error(err)
      setError('Quick Note could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="quick-note-modal">
        <h2>Quick Note</h2>

        <p className="modal-subtitle">
          Session {session.sessionNumber}
        </p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What do you want to remember?"
          autoFocus
        />

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Quick Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewScreen({
  session,
  reviewDraft,
  reviewItems,
  quickNotes,
  onClose,
}: {
  session: Session
  reviewDraft: ReviewDraft
  reviewItems: ReviewItem[]
  quickNotes: QuickNote[]
  onClose: () => void
}) {
  const initialIndex = Math.max(
    0,
    reviewItems.findIndex(
      (item) =>
        item.id === reviewDraft.currentReviewItemId
    )
  )

  const [items, setItems] =
    useState<ReviewItem[]>(reviewItems)

  const [currentIndex, setCurrentIndex] =
    useState(initialIndex)

  const [destinations, setDestinations] =
    useState<ReviewDestination[]>([])

  const [
    isLoadingDestinations,
    setIsLoadingDestinations,
  ] = useState(true)

  const currentItem = items[currentIndex]

  const sourceNote = quickNotes.find(
    (note) =>
      note.id === currentItem?.quickNoteId
  )

  const journalDestination =
    destinations.find(
      (destination) =>
        destination.destinationType === 'journal'
    )

  useEffect(() => {
    if (!currentItem) {
      return
    }

    let cancelled = false

    async function loadDestinations() {
      setIsLoadingDestinations(true)

      const result =
        await getReviewDestinations(
          currentItem.id
        )

      if (!cancelled) {
        setDestinations(result)
        setIsLoadingDestinations(false)
      }
    }

    void loadDestinations()

    return () => {
      cancelled = true
    }
  }, [currentItem?.id])

  useEffect(() => {
    if (!currentItem) {
      return
    }

    const saveTimer = window.setTimeout(() => {
      void updateReviewItemText(
        currentItem.id,
        currentItem.workingText
      ).catch((error) => {
        console.error(
          'Could not auto-save Review text.',
          error
        )
      })
    }, 500)

    return () => {
      window.clearTimeout(saveTimer)
    }
  }, [
    currentItem?.id,
    currentItem?.workingText,
  ])

  useEffect(() => {
    if (!journalDestination) {
      return
    }

    const saveTimer = window.setTimeout(() => {
      void updateReviewDestinationText(
        journalDestination.id,
        journalDestination.text
      ).catch((error) => {
        console.error(
          'Could not auto-save Journal destination.',
          error
        )
      })
    }, 500)

    return () => {
      window.clearTimeout(saveTimer)
    }
  }, [
    journalDestination?.id,
    journalDestination?.text,
  ])

  function handleWorkingTextChange(
    newText: string
  ) {
    if (!currentItem) {
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === currentItem.id
          ? {
              ...item,
              workingText: newText,
            }
          : item
      )
    )
  }

  function handleJournalTextChange(
    newText: string
  ) {
    if (!journalDestination) {
      return
    }

    setDestinations((current) =>
      current.map((destination) =>
        destination.id === journalDestination.id
          ? {
              ...destination,
              text: newText,
            }
          : destination
      )
    )
  }

  async function handleAddJournal() {
    if (!currentItem) {
      return
    }

    const destination =
      await addJournalDestination(
        currentItem.id,
        currentItem.workingText
      )

    setDestinations((current) => {
      const alreadyExists = current.some(
        (item) => item.id === destination.id
      )

      if (alreadyExists) {
        return current
      }

      return [...current, destination]
    })
  }

  async function handleRemoveJournal() {
    if (!journalDestination) {
      return
    }

    await removeReviewDestination(
      journalDestination.id
    )

    setDestinations((current) =>
      current.filter(
        (destination) =>
          destination.id !==
          journalDestination.id
      )
    )
  }

  async function saveCurrentReviewState() {
    if (!currentItem) {
      return
    }

    await updateReviewItemText(
      currentItem.id,
      currentItem.workingText
    )

    if (journalDestination) {
      await updateReviewDestinationText(
        journalDestination.id,
        journalDestination.text
      )
    }
  }

  async function goToIndex(
    nextIndex: number
  ) {
    const nextItem = items[nextIndex]

    if (!currentItem || !nextItem) {
      return
    }

    await saveCurrentReviewState()

    await setCurrentReviewItem(
      reviewDraft.id,
      nextItem.id
    )

    setCurrentIndex(nextIndex)
  }

  async function handleBackToToday() {
    if (currentItem) {
      await saveCurrentReviewState()

      await setCurrentReviewItem(
        reviewDraft.id,
        currentItem.id
      )
    }

    onClose()
  }

  if (!currentItem || !sourceNote) {
    return (
      <main className="review-workspace">
        <button
          className="review-back-button"
          onClick={onClose}
        >
          ← Back to Today
        </button>

        <div className="review-panel">
          <h1>Session Review</h1>
          <p>No review items were found.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="review-workspace">
      <div className="review-header">
        <button
          className="review-back-button"
          onClick={handleBackToToday}
        >
          ← Back to Today
        </button>

        <div>
          <strong>
            Session {session.sessionNumber}
          </strong>

          <span className="review-position">
            Quick Note {currentIndex + 1} of{' '}
            {items.length}
          </span>
        </div>
      </div>

      <div className="review-panel">
        <h1>Session Review</h1>

        <div className="review-block">
          <h2>Original Quick Note</h2>

          <p className="original-note">
            {sourceNote.text}
          </p>
        </div>

        <div className="review-block">
          <h2>Working Text</h2>

          <textarea
            value={currentItem.workingText}
            onChange={(event) =>
              handleWorkingTextChange(
                event.target.value
              )
            }
          />

          <p className="review-help">
            Changes are saved automatically to the
            Review workspace. The original Quick Note
            remains unchanged.
          </p>
        </div>

        <div className="review-block">
          <h2>Destinations</h2>

          {isLoadingDestinations ? (
            <p className="review-help">
              Loading destinations…
            </p>
          ) : journalDestination ? (
            <div className="destination-card">
              <div className="destination-heading">
                <strong>Journal</strong>

                <button
                  className="destination-remove"
                  onClick={handleRemoveJournal}
                >
                  Remove
                </button>
              </div>

              <textarea
                value={journalDestination.text}
                onChange={(event) =>
                  handleJournalTextChange(
                    event.target.value
                  )
                }
              />

              <p className="review-help">
                Journal text is now independent from
                Working Text.
              </p>
            </div>
          ) : (
            <>
              <p className="review-help">
                Choose where this reviewed information
                should be used.
              </p>

              <button
                className="destination-add"
                onClick={handleAddJournal}
              >
                + Add to Journal
              </button>
            </>
          )}
        </div>

        <div className="review-navigation">
          <button
            className="modal-cancel"
            onClick={() =>
              void goToIndex(currentIndex - 1)
            }
            disabled={currentIndex === 0}
          >
            Previous
          </button>

          <button
            className="primary-button"
            onClick={() =>
              void goToIndex(currentIndex + 1)
            }
            disabled={
              currentIndex === items.length - 1
            }
          >
            Next
          </button>
        </div>
      </div>
    </main>
  )
}

function TodayPage({
  campaign,
  activeSession,
  quickNotes,
  openReviews,
  onStartSession,
  onEndSession,
  onQuickNoteSaved,
  onOpenReview,
}: {
  campaign: Campaign
  activeSession: Session | undefined
  quickNotes: QuickNote[]
  openReviews: Session[]
  onStartSession: () => Promise<void>
  onEndSession: () => Promise<void>
  onQuickNoteSaved: (quickNote: QuickNote) => void
  onOpenReview: (session: Session) => Promise<void>
}) {
  const [isStarting, setIsStarting] =
    useState(false)

  const [isEnding, setIsEnding] =
    useState(false)

  const [error, setError] =
    useState('')

  const [showQuickNote, setShowQuickNote] =
    useState(false)

  async function handleStartSession() {
    try {
      setError('')
      setIsStarting(true)
      await onStartSession()
    } catch (err) {
      console.error(err)
      setError('Session could not be started.')
    } finally {
      setIsStarting(false)
    }
  }

  async function handleEndSession() {
    try {
      setError('')
      setIsEnding(true)
      await onEndSession()
    } catch (err) {
      console.error(err)
      setError('Session could not be ended.')
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <>
      <section className="page left-page">
        <h1>Today's Adventure</h1>

        <p className="subtitle">
          {campaign.name}
        </p>

        <div className="page-section">
          <h2>Session</h2>

          {activeSession ? (
            <>
              <p>
                <strong>
                  Session{' '}
                  {activeSession.sessionNumber}
                </strong>
              </p>

              <p>
                This session is currently active.
              </p>

              <p className="session-note-count">
                Quick Notes: {quickNotes.length}
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowQuickNote(true)
                }
              >
                Quick Note
              </button>

              <button
                className="secondary-button"
                onClick={handleEndSession}
                disabled={isEnding}
              >
                {isEnding
                  ? 'Ending…'
                  : 'End Session'}
              </button>
            </>
          ) : openReviews.length > 0 ? (
            <>
              <div className="open-reviews">
                <h3>Open Reviews</h3>

                {openReviews.map(
                  (session) => (
                    <div
                      className="review-card"
                      key={session.id}
                    >
                      <strong>
                        Session{' '}
                        {session.sessionNumber}
                      </strong>

                      <span>
                        {session.status ===
                        'reviewing'
                          ? 'In progress'
                          : 'Ready for review'}
                      </span>

                      <button
                        className="review-button"
                        onClick={() =>
                          onOpenReview(session)
                        }
                      >
                        {session.status ===
                        'reviewing'
                          ? 'Resume Review'
                          : 'Start Review'}
                      </button>
                    </div>
                  )
                )}
              </div>

              <button
                className="primary-button start-with-reviews"
                onClick={handleStartSession}
                disabled={isStarting}
              >
                {isStarting
                  ? 'Starting…'
                  : 'Start New Session'}
              </button>
            </>
          ) : (
            <>
              <p>
                No session is currently active.
              </p>

              <button
                className="primary-button"
                onClick={handleStartSession}
                disabled={isStarting}
              >
                {isStarting
                  ? 'Starting…'
                  : 'Start New Session'}
              </button>
            </>
          )}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="page right-page">
        <div className="page-section">
          <h2>Goals</h2>

          <p className="empty-message">
            Your active goals will appear here.
          </p>
        </div>

        <div className="page-section">
          <h2>Reminders</h2>

          <p className="empty-message">
            Pinned reminders will appear here.
          </p>
        </div>
      </section>

      {showQuickNote && activeSession && (
        <QuickNoteModal
          session={activeSession}
          onClose={() =>
            setShowQuickNote(false)
          }
          onSaved={(quickNote) => {
            onQuickNoteSaved(quickNote)
            setShowQuickNote(false)
          }}
        />
      )}
    </>
  )
}

function PlaceholderPage({
  title,
}: {
  title: string
}) {
  return (
    <>
      <section className="page left-page">
        <h1>{title}</h1>

        <p className="subtitle">
          This section will be built in a later stage.
        </p>
      </section>

      <section className="page right-page">
        <div className="page-section">
          <h2>Coming soon</h2>

          <p className="empty-message">
            The Campaign Guide foundation is working.
          </p>
        </div>
      </section>
    </>
  )
}

function CampaignSetup({
  onCreated,
}: {
  onCreated: (campaign: Campaign) => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] =
    useState(false)

  async function handleCreate() {
    setError('')

    if (!name.trim()) {
      setError('Campaign name is required.')
      return
    }

    try {
      setIsCreating(true)

      const campaign =
        await createCampaign(name)

      onCreated(campaign)
    } catch (err) {
      console.error(err)

      setError(
        'Campaign could not be created.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="setup-screen">
      <div className="setup-card">
        <div className="setup-mark">✦</div>

        <h1>
          Welcome to Campaign Guide
        </h1>

        <p>
          Keep your sessions, character,
          people, discoveries, goals, and
          during-play notes together in one
          place.
        </p>

        <label htmlFor="campaign-name">
          Campaign Name
        </label>

        <input
          id="campaign-name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Enter campaign name"
          autoFocus
        />

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          className="primary-button setup-button"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating
            ? 'Creating…'
            : 'Create Campaign'}
        </button>
      </div>
    </main>
  )
}

function CampaignApp({
  campaign,
}: {
  campaign: Campaign
}) {
  const [activeSection, setActiveSection] =
    useState<Section>('today')

  const [activeSession, setActiveSession] =
    useState<Session | undefined>()

  const [quickNotes, setQuickNotes] =
    useState<QuickNote[]>([])

  const [openReviews, setOpenReviews] =
    useState<Session[]>([])

  const [reviewSession, setReviewSession] =
    useState<Session | undefined>()

  const [reviewDraft, setReviewDraft] =
    useState<ReviewDraft | undefined>()

  const [reviewItems, setReviewItems] =
    useState<ReviewItem[]>([])

  const [
    reviewQuickNotes,
    setReviewQuickNotes,
  ] = useState<QuickNote[]>([])

  const [
    isLoadingSession,
    setIsLoadingSession,
  ] = useState(true)

  useEffect(() => {
    async function loadSessionState() {
      const session =
        await getActiveSession(
          campaign.id
        )

      setActiveSession(session)

      if (session) {
        const notes =
          await getQuickNotesForSession(
            session.id
          )

        setQuickNotes(notes)
        setOpenReviews([])
      } else {
        setQuickNotes([])

        const reviews =
          await getOpenReviews(
            campaign.id
          )

        setOpenReviews(reviews)
      }

      setIsLoadingSession(false)
    }

    loadSessionState()
  }, [campaign.id])

  async function handleStartSession() {
    const newSession =
      await startSession(campaign.id)

    setActiveSession(newSession)
    setQuickNotes([])
    setOpenReviews([])
  }

  async function handleEndSession() {
    if (!activeSession) {
      return
    }

    await endSession(
      activeSession.id
    )

    setActiveSession(undefined)
    setQuickNotes([])

    const reviews =
      await getOpenReviews(
        campaign.id
      )

    setOpenReviews(reviews)
  }

  async function handleOpenReview(
    session: Session
  ) {
    const result =
      await startOrResumeReview(
        session.id
      )

    const notes =
      await getQuickNotesForSession(
        session.id
      )

    setReviewSession({
      ...session,
      status: 'reviewing',
    })

    setReviewDraft(
      result.reviewDraft
    )

    setReviewItems(
      result.reviewItems
    )

    setReviewQuickNotes(notes)

    const reviews =
      await getOpenReviews(
        campaign.id
      )

    setOpenReviews(reviews)
  }

  function closeReview() {
    setReviewSession(undefined)
    setReviewDraft(undefined)
    setReviewItems([])
    setReviewQuickNotes([])
  }

  if (
    reviewSession &&
    reviewDraft
  ) {
    return (
      <ReviewScreen
        session={reviewSession}
        reviewDraft={reviewDraft}
        reviewItems={reviewItems}
        quickNotes={reviewQuickNotes}
        onClose={closeReview}
      />
    )
  }

  if (isLoadingSession) {
    return (
      <main className="loading-screen">
        Loading session…
      </main>
    )
  }

  const activeLabel =
    sections.find(
      (section) =>
        section.id === activeSection
    )?.label ?? 'Today'

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="app-mark">
          ✦
        </div>

        {sections.map(
          (section) => (
            <button
              key={section.id}
              className={
                activeSection ===
                section.id
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActiveSection(
                  section.id
                )
              }
            >
              {section.label}
            </button>
          )
        )}
      </nav>

      <main className="book-area">
        <div className="book">
          {activeSection ===
          'today' ? (
            <TodayPage
              campaign={campaign}
              activeSession={
                activeSession
              }
              quickNotes={
                quickNotes
              }
              openReviews={
                openReviews
              }
              onStartSession={
                handleStartSession
              }
              onEndSession={
                handleEndSession
              }
              onQuickNoteSaved={(
                quickNote
              ) =>
                setQuickNotes(
                  (current) => [
                    ...current,
                    quickNote,
                  ]
                )
              }
              onOpenReview={
                handleOpenReview
              }
            />
          ) : (
            <PlaceholderPage
              title={activeLabel}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function App() {
  const [campaign, setCampaign] =
    useState<Campaign | undefined>()

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    async function loadCampaign() {
      const existingCampaign =
        await getCampaign()

      setCampaign(
        existingCampaign
      )

      setIsLoading(false)
    }

    loadCampaign()
  }, [])

  if (isLoading) {
    return (
      <main className="loading-screen">
        Loading Campaign Guide…
      </main>
    )
  }

  if (!campaign) {
    return (
      <CampaignSetup
        onCreated={setCampaign}
      />
    )
  }

  return (
    <CampaignApp
      campaign={campaign}
    />
  )
}

export default App