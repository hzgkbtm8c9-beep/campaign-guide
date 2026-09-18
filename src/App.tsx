import { useEffect, useRef, useState } from 'react'
import './App.css'
import PeoplePage from './pages/PeoplePage'
import DiscoveriesPage from './pages/DiscoveriesPage'
import JournalPage from './pages/JournalPage'
import CharacterPage from './pages/CharacterPage'
import CharacterModulePage from './pages/CharacterModulePage'
import GoalsPage from './pages/GoalsPage'
import RemindersPage from './pages/RemindersPage'
import GuidePage from './pages/GuidePage'
import todayIllustration from './assets/today/Campaign guide image2.png'
import leatherTexture from './assets/textures/leather-texture.png'
import paperTexture from './assets/textures/paper-texture.png'
import distressOverlay from './assets/textures/distress-overlay.png'

import {
  addDiscoveryDestination,
  addJournalDestination,
  addPersonDestination,
  addReviewDraftDiscoveryDestination,
  addReviewDraftPersonDestination,
  completeReview,
  createCampaign,
  deleteCampaign,
  createQuickNote,
  createReviewDraftCategory,
  createReviewDraftDiscoveryAndDestination,
  createReviewDraftPersonAndDestination,
  endSession,
  getActiveSession,
  getCampaigns,
  getDiscoveries,
  getDiscoveryCategories,
  getOpenReviews,
  getPeople,
  getQuickNotesForSession,
  getReviewDestinations,
  getReviewDraftCategories,
  getReviewDraftDiscoveries,
  getReviewDraftPeople,
  getReviewResolutionSummary,
  getReviewSummaryData,
  removeReviewDestination,
  setCurrentReviewItem,
  setReviewItemDiscarded,
  startOrResumeReview,
  startSession,
  updateSessionTitle,
  updateReviewDestinationText,
  updateReviewItemText,
  getGoals,
  getReminders,
  exportCampaign,
  importCampaign,
  replaceCampaignFromBackup,
} from './data/repository'

import type {
  Campaign,
  Discovery,
  DiscoveryCategory,
  Person,
  QuickNote,
  ReviewDestination,
  ReviewDraft,
  ReviewDraftCategory,
  ReviewDraftDiscovery,
  ReviewDraftPerson,
  ReviewItem,
  Session,
  Goal,
  Reminder,
} from './data/database'

import {
  Sparkles,
  Contact,
  Package,
  Target,
  Users,
  Compass,
  Feather,
  Bookmark,
  BookOpen,
} from 'lucide-react'

import GuideHelpButton from './components/GuideHelpButton'

type Section =
  | 'today'
  | 'character'
  | 'characterModule'
  | 'goals'
  | 'people'
  | 'discoveries'
  | 'journal'
  | 'reminders'
  | 'guide'

const textureVariables = {
  '--leather-texture': `url(${leatherTexture})`,
  '--paper-texture': `url(${paperTexture})`,
  '--distress-overlay': `url(${distressOverlay})`,
} as React.CSSProperties

const sections: {
  id: Section
  label: string
}[] = [
  { id: 'today', label: 'Today' },
  { id: 'character', label: 'Character' },
  { id: 'characterModule', label: 'Ferret' },
  { id: 'goals', label: 'Goals' },
  { id: 'people', label: 'People' },
  { id: 'discoveries', label: 'Discoveries' },
  { id: 'journal', label: 'Journal' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'guide', label: 'Guide' },
]

const sectionIcons = {
  today: Sparkles,
  character: Contact,
  characterModule: Package,
  goals: Target,
  people: Users,
  discoveries: Compass,
  journal: Feather,
  reminders: Bookmark,
  guide: BookOpen,
}

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
  const [isSaving, setIsSaving] =
    useState(false)

  async function handleSave() {
    setError('')

    if (!text.trim()) {
      setError(
        'Quick Note text is required.'
      )
      return
    }

    try {
      setIsSaving(true)

      const quickNote =
        await createQuickNote(
          session.campaignId,
          session.id,
          text
        )

      onSaved(quickNote)
    } catch (error) {
      console.error(error)

      setError(
        'Quick Note could not be saved.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="quick-note-modal">
        <h2 className="modal-title">Quick Note</h2>

        <p className="modal-subtitle">
          Session {session.sessionNumber}
        </p>

        <textarea
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="What do you want to remember?"
          autoFocus
        />

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button
            className="secondary-button"
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
            {isSaving
              ? 'Saving…'
              : 'Save Quick Note'}
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
  onCompleted,
}: {
  session: Session
  reviewDraft: ReviewDraft
  reviewItems: ReviewItem[]
  quickNotes: QuickNote[]
  onClose: () => void
  onCompleted: () => Promise<void>
}) {
  const initialIndex = Math.max(
    0,
    reviewItems.findIndex(
      (item) =>
        item.id ===
        reviewDraft.currentReviewItemId
    )
  )

  const [items, setItems] =
    useState<ReviewItem[]>(reviewItems)

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(initialIndex)

  const [
    destinations,
    setDestinations,
  ] = useState<ReviewDestination[]>([])

  const [people, setPeople] =
    useState<Person[]>([])

  const [
    draftPeople,
    setDraftPeople,
  ] = useState<ReviewDraftPerson[]>([])

  const [
    categories,
    setCategories,
  ] = useState<DiscoveryCategory[]>([])

  const [
    draftCategories,
    setDraftCategories,
  ] = useState<ReviewDraftCategory[]>([])

  const [
    discoveries,
    setDiscoveries,
  ] = useState<Discovery[]>([])

  const [
    draftDiscoveries,
    setDraftDiscoveries,
  ] = useState<
    ReviewDraftDiscovery[]
  >([])

  const [
    isLoadingDestinations,
    setIsLoadingDestinations,
  ] = useState(true)

  const [
    showPersonPicker,
    setShowPersonPicker,
  ] = useState(false)

  const [
    newPersonName,
    setNewPersonName,
  ] = useState('')

  const [
    personError,
    setPersonError,
  ] = useState('')

  const [
    showDiscoveryPicker,
    setShowDiscoveryPicker,
  ] = useState(false)

  const [
    newDiscoveryTitle,
    setNewDiscoveryTitle,
  ] = useState('')

  const [
    selectedCategoryRef,
    setSelectedCategoryRef,
  ] = useState('')

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState('')

  const [
    discoveryError,
    setDiscoveryError,
  ] = useState('')

  const [
    resolvedItemIds,
    setResolvedItemIds,
  ] = useState<string[]>([])

  const [
    showSummary,
    setShowSummary,
  ] = useState(false)

  const [
    summaryEntries,
    setSummaryEntries,
  ] = useState<
    Awaited<
      ReturnType<
        typeof getReviewSummaryData
      >
    >
  >([])

  const [
    isCompleting,
    setIsCompleting,
  ] = useState(false)

  const [
    completionError,
    setCompletionError,
  ] = useState('')

  async function refreshResolutionSummary() {
    const summary =
      await getReviewResolutionSummary(
        reviewDraft.id
      )

    setResolvedItemIds(
      summary.resolvedItemIds
    )

    return summary
  }

  const currentItem =
    items[currentIndex]

  const sourceNote =
    quickNotes.find(
      (note) =>
        note.id ===
        currentItem?.quickNoteId
    )

  const journalDestination =
    destinations.find(
      (destination) =>
        destination.destinationType ===
        'journal'
    )

  const personDestinations =
    destinations.filter(
      (destination) =>
        destination.destinationType ===
        'person'
    )

  const discoveryDestinations =
    destinations.filter(
      (destination) =>
        destination.destinationType ===
        'discovery'
    )

  const currentItemResolved =
    Boolean(
      currentItem &&
        resolvedItemIds.includes(
          currentItem.id
        )
    )

  const resolvedCount =
    resolvedItemIds.length

  const allItemsResolved =
    items.length > 0 &&
    resolvedCount === items.length

  useEffect(() => {
    async function loadReferenceData() {
      const [
        permanentPeople,
        temporaryPeople,
        permanentCategories,
        temporaryCategories,
        permanentDiscoveries,
        temporaryDiscoveries,
      ] = await Promise.all([
        getPeople(
          session.campaignId
        ),

        getReviewDraftPeople(
          reviewDraft.id
        ),

        getDiscoveryCategories(
          session.campaignId
        ),

        getReviewDraftCategories(
          reviewDraft.id
        ),

        getDiscoveries(
          session.campaignId
        ),

        getReviewDraftDiscoveries(
          reviewDraft.id
        ),
      ])

      setPeople(
        permanentPeople
      )

      setDraftPeople(
        temporaryPeople
      )

      setCategories(
        permanentCategories
      )

      setDraftCategories(
        temporaryCategories
      )

      setDiscoveries(
        permanentDiscoveries
      )

      setDraftDiscoveries(
        temporaryDiscoveries
      )

      if (
        !selectedCategoryRef &&
        permanentCategories.length > 0
      ) {
        setSelectedCategoryRef(
          permanentCategories[0].id
        )
      }
    }

    void loadReferenceData()
  }, [
    session.campaignId,
    reviewDraft.id,
  ])

  useEffect(() => {
    void refreshResolutionSummary()
  }, [reviewDraft.id])

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

        setIsLoadingDestinations(
          false
        )
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

    const saveTimer =
      window.setTimeout(() => {
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
      window.clearTimeout(
        saveTimer
      )
    }
  }, [
    currentItem?.id,
    currentItem?.workingText,
  ])

  useEffect(() => {
    const timers =
      destinations.map(
        (destination) =>
          window.setTimeout(() => {
            void updateReviewDestinationText(
              destination.id,
              destination.text
            ).catch((error) => {
              console.error(
                'Could not auto-save Review destination.',
                error
              )
            })
          }, 500)
      )

    return () => {
      timers.forEach(
        (timer) =>
          window.clearTimeout(
            timer
          )
      )
    }
  }, [destinations])

  function handleDestinationTextChange(
    destinationId: string,
    text: string
  ) {
    setDestinations(
      (current) =>
        current.map(
          (destination) =>
            destination.id ===
            destinationId
              ? {
                  ...destination,
                  text,
                }
              : destination
        )
    )
  }

  function getCategoryName(
    categoryRef: string
  ) {
    const permanentCategory =
      categories.find(
        (category) =>
          category.id ===
          categoryRef
      )

    if (permanentCategory) {
      return permanentCategory.name
    }

    const draftCategory =
      draftCategories.find(
        (category) =>
          category.id ===
          categoryRef
      )

    if (draftCategory) {
      return `${draftCategory.name} — New`
    }

    return 'Unknown Category'
  }

  function getPersonLabel(
    destination:
      ReviewDestination
  ) {
    const permanentPerson =
      people.find(
        (person) =>
          person.id ===
          destination.targetId
      )

    if (permanentPerson) {
      return permanentPerson.name
    }

    const draftPerson =
      draftPeople.find(
        (person) =>
          person.id ===
          destination.targetId
      )

    if (draftPerson) {
      return `${draftPerson.name} — New`
    }

    return 'Unavailable Person'
  }

  function getDiscoveryLabel(
    destination:
      ReviewDestination
  ) {
    const permanentDiscovery =
      discoveries.find(
        (discovery) =>
          discovery.id ===
          destination.targetId
      )

    if (permanentDiscovery) {
      return `${permanentDiscovery.title} — ${getCategoryName(
        permanentDiscovery.categoryId
      )}`
    }

    const draftDiscovery =
      draftDiscoveries.find(
        (discovery) =>
          discovery.id ===
          destination.targetId
      )

    if (draftDiscovery) {
      const permanentCategory =
        categories.find(
          (category) =>
            category.id ===
            draftDiscovery.categoryRef
        )

      const draftCategory =
        draftCategories.find(
          (category) =>
            category.id ===
            draftDiscovery.categoryRef
        )

      const categoryName =
        permanentCategory?.name ??
        draftCategory?.name ??
        'Unknown Category'

      return `${draftDiscovery.title} — ${categoryName} — New`
    }

    return 'Unavailable Discovery'
  }

  function getDestinationLabel(
    destination:
      ReviewDestination
  ) {
    if (
      destination.destinationType ===
      'journal'
    ) {
      return 'Journal'
    }

    if (
      destination.destinationType ===
      'person'
    ) {
      return `Person: ${getPersonLabel(
        destination
      )}`
    }

    return `Discovery: ${getDiscoveryLabel(
      destination
    )}`
  }

  async function handleDiscardToggle() {
    if (!currentItem) {
      return
    }

    const nextValue =
      !currentItem.isDiscarded

    const updatedItem =
      await setReviewItemDiscarded(
        currentItem.id,
        nextValue
      )

    if (!updatedItem) {
      return
    }

    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id ===
            updatedItem.id
              ? updatedItem
              : item
        )
    )

    await refreshResolutionSummary()
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

    setDestinations(
      (current) => {
        const alreadyExists =
          current.some(
            (item) =>
              item.id ===
              destination.id
          )

        if (alreadyExists) {
          return current
        }

        return [
          ...current,
          destination,
        ]
      }
    )

    await refreshResolutionSummary()
  }

  async function handleAddPermanentPerson(
    person: Person
  ) {
    if (!currentItem) {
      return
    }

    setPersonError('')

    try {
      const destination =
        await addPersonDestination(
          currentItem.id,
          person.id,
          currentItem.workingText
        )

      setDestinations(
        (current) => {
          const alreadyExists =
            current.some(
              (item) =>
                item.id ===
                destination.id
            )

          if (alreadyExists) {
            return current
          }

          return [
            ...current,
            destination,
          ]
        }
      )

      await refreshResolutionSummary()

      setShowPersonPicker(false)
    } catch (error) {
      console.error(error)

      setPersonError(
        'Person destination could not be added.'
      )
    }
  }

  async function handleAddDraftPerson(
    draftPerson:
      ReviewDraftPerson
  ) {
    if (!currentItem) {
      return
    }

    setPersonError('')

    try {
      const destination =
        await addReviewDraftPersonDestination(
          currentItem.id,
          draftPerson.id,
          currentItem.workingText
        )

      setDestinations(
        (current) => {
          const alreadyExists =
            current.some(
              (item) =>
                item.id ===
                destination.id
            )

          if (alreadyExists) {
            return current
          }

          return [
            ...current,
            destination,
          ]
        }
      )

      await refreshResolutionSummary()

      setShowPersonPicker(false)
    } catch (error) {
      console.error(error)

      setPersonError(
        'Draft Person destination could not be added.'
      )
    }
  }

  async function handleCreateDraftPerson() {
    if (!currentItem) {
      return
    }

    const trimmedName =
      newPersonName.trim()

    if (!trimmedName) {
      setPersonError(
        'Person name is required.'
      )
      return
    }

    setPersonError('')

    try {
      const result =
        await createReviewDraftPersonAndDestination(
          reviewDraft.id,
          currentItem.id,
          trimmedName,
          currentItem.workingText
        )

      setDraftPeople(
        (current) =>
          [
            ...current,
            result.draftPerson,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
      )

      setDestinations(
        (current) => [
          ...current,
          result.destination,
        ]
      )

      await refreshResolutionSummary()

      setNewPersonName('')
      setShowPersonPicker(false)
    } catch (error) {
      console.error(error)

      setPersonError(
        'Draft Person could not be created.'
      )
    }
  }

  async function handleAddPermanentDiscovery(
    discovery: Discovery
  ) {
    if (!currentItem) {
      return
    }

    setDiscoveryError('')

    try {
      const destination =
        await addDiscoveryDestination(
          currentItem.id,
          discovery.id,
          currentItem.workingText
        )

      setDestinations(
        (current) => {
          const alreadyExists =
            current.some(
              (item) =>
                item.id ===
                destination.id
            )

          if (alreadyExists) {
            return current
          }

          return [
            ...current,
            destination,
          ]
        }
      )

      await refreshResolutionSummary()

      setShowDiscoveryPicker(
        false
      )
    } catch (error) {
      console.error(error)

      setDiscoveryError(
        'Discovery destination could not be added.'
      )
    }
  }

  async function handleAddDraftDiscovery(
    draftDiscovery:
      ReviewDraftDiscovery
  ) {
    if (!currentItem) {
      return
    }

    setDiscoveryError('')

    try {
      const destination =
        await addReviewDraftDiscoveryDestination(
          currentItem.id,
          draftDiscovery.id,
          currentItem.workingText
        )

      setDestinations(
        (current) => {
          const alreadyExists =
            current.some(
              (item) =>
                item.id ===
                destination.id
            )

          if (alreadyExists) {
            return current
          }

          return [
            ...current,
            destination,
          ]
        }
      )

      await refreshResolutionSummary()

      setShowDiscoveryPicker(
        false
      )
    } catch (error) {
      console.error(error)

      setDiscoveryError(
        'Draft Discovery destination could not be added.'
      )
    }
  }

  async function handleCreateDraftCategory() {
    const trimmedName =
      newCategoryName.trim()

    if (!trimmedName) {
      setDiscoveryError(
        'Category name is required.'
      )
      return
    }

    setDiscoveryError('')

    try {
      const category =
        await createReviewDraftCategory(
          reviewDraft.id,
          trimmedName
        )

      setDraftCategories(
        (current) =>
          [
            ...current,
            category,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
      )

      setSelectedCategoryRef(
        category.id
      )

      setNewCategoryName('')
    } catch (error) {
      console.error(error)

      setDiscoveryError(
        'Category could not be created.'
      )
    }
  }

  async function handleCreateDraftDiscovery() {
    if (!currentItem) {
      return
    }

    const trimmedTitle =
      newDiscoveryTitle.trim()

    if (!trimmedTitle) {
      setDiscoveryError(
        'Discovery title is required.'
      )
      return
    }

    if (!selectedCategoryRef) {
      setDiscoveryError(
        'Discovery category is required.'
      )
      return
    }

    setDiscoveryError('')

    try {
      const result =
        await createReviewDraftDiscoveryAndDestination(
          reviewDraft.id,
          currentItem.id,
          trimmedTitle,
          selectedCategoryRef,
          currentItem.workingText
        )

      setDraftDiscoveries(
        (current) =>
          [
            ...current,
            result.draftDiscovery,
          ].sort(
            (a, b) =>
              a.title.localeCompare(
                b.title
              )
          )
      )

      setDestinations(
        (current) => [
          ...current,
          result.destination,
        ]
      )

      await refreshResolutionSummary()

      setNewDiscoveryTitle('')

      setShowDiscoveryPicker(
        false
      )
    } catch (error) {
      console.error(error)

      setDiscoveryError(
        'Draft Discovery could not be created.'
      )
    }
  }

  async function handleRemoveDestination(
    destinationId: string
  ) {
    await removeReviewDestination(
      destinationId
    )

    setDestinations(
      (current) =>
        current.filter(
          (destination) =>
            destination.id !==
            destinationId
        )
    )

    await refreshResolutionSummary()
  }

  async function saveCurrentReviewState() {
    if (!currentItem) {
      return
    }

    await updateReviewItemText(
      currentItem.id,
      currentItem.workingText
    )

    for (
      const destination
      of destinations
    ) {
      await updateReviewDestinationText(
        destination.id,
        destination.text
      )
    }
  }

  async function goToIndex(
    nextIndex: number
  ) {
    const nextItem =
      items[nextIndex]

    if (
      !currentItem ||
      !nextItem
    ) {
      return
    }

    await saveCurrentReviewState()

    await setCurrentReviewItem(
      reviewDraft.id,
      nextItem.id
    )

    setShowPersonPicker(false)

    setShowDiscoveryPicker(
      false
    )

    setPersonError('')
    setDiscoveryError('')

    setNewPersonName('')
    setNewDiscoveryTitle('')
    setNewCategoryName('')

    setCurrentIndex(
      nextIndex
    )
  }

  async function handleNext() {
    await saveCurrentReviewState()

    const summary =
      await getReviewSummaryData(
        reviewDraft.id
      )

    setSummaryEntries(summary)

    /*
     * Find the next unresolved
     * Quick Note after the current
     * position. Wrap back to the
     * beginning when necessary.
     */
    for (
      let offset = 1;
      offset <= items.length;
      offset += 1
    ) {
      const nextIndex =
        (currentIndex + offset) %
        items.length

      const nextItem =
        items[nextIndex]

      const summaryEntry =
        summary.find(
          (entry) =>
            entry.reviewItem.id ===
            nextItem.id
        )

      if (
        summaryEntry &&
        !summaryEntry.isResolved
      ) {
        await goToIndex(nextIndex)
        return
      }
    }

    /*
     * Nothing unresolved remains,
     * so go directly to Summary.
     */
    setCompletionError('')
    setShowSummary(true)
  }

  async function handleOpenSummary() {
    setCompletionError('')

    await saveCurrentReviewState()

    await refreshResolutionSummary()

    const summary =
      await getReviewSummaryData(
        reviewDraft.id
      )

    setSummaryEntries(
      summary
    )

    setShowSummary(true)
  }

  async function handleSummaryJump(
    reviewItemId: string
  ) {
    const index =
      items.findIndex(
        (item) =>
          item.id ===
          reviewItemId
      )

    if (index < 0) {
      return
    }

    await setCurrentReviewItem(
      reviewDraft.id,
      reviewItemId
    )

    setCurrentIndex(index)

    setShowSummary(false)

    setShowPersonPicker(false)

    setShowDiscoveryPicker(
      false
    )

    setCompletionError('')
  }

  async function handleCompleteReview() {
    setCompletionError('')

    try {
      setIsCompleting(true)

      await saveCurrentReviewState()

      const resolution =
        await refreshResolutionSummary()

      if (
        resolution.unresolvedCount > 0
      ) {
        setCompletionError(
          'All Quick Notes must be resolved before Review can be completed.'
        )
        return
      }

      await completeReview(
        reviewDraft.id
      )

      await onCompleted()
    } catch (error) {
      console.error(error)

      setCompletionError(
        'Review could not be completed.'
      )
    } finally {
      setIsCompleting(false)
    }
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

  if (
    !currentItem ||
    !sourceNote
  ) {
    return (
      <main
        className="review-workspace"
        style={textureVariables}
      >
        <button
          className="secondary-button compact-button review-empty-back-button"
          onClick={onClose}
        >
          ← Back to Today
        </button>

        <div className="review-panel">
          <h1 className="page-title">
            Session Review
          </h1>

          <p>
            No review items were found.
          </p>
        </div>
      </main>
    )
  }

  if (showSummary) {
    return (
      <main
        className="review-workspace"
        style={textureVariables}
      >
        <div className="review-header">
          <div>
            <strong>
              Session{' '}
              {session.sessionNumber}
            </strong>

            <span className="review-position">
              Resolved{' '}
              {resolvedCount} of{' '}
              {items.length}
            </span>
          </div>
        </div>

        <div className="review-panel">
          <div className="review-title-row">
            <div>
              <h1 className="page-title">
                Review Summary
              </h1>

              <p className="review-help">
                Review what will be
                committed before
                completing this Session.
              </p>
            </div>

            <button
              className="secondary-button compact-button"
              onClick={
                handleBackToToday
              }
            >
              Back to Today
            </button>
          </div>

          <div className="summary-list">
            {summaryEntries.map(
              (entry, index) => (
                <div
                  className="summary-card"
                  key={
                    entry.reviewItem.id
                  }
                >
                  <div className="summary-card-header">
                    <div>
                      <strong>
                        Quick Note{' '}
                        {index + 1}
                      </strong>

                      <span
                        className={
                          entry.isResolved
                            ? 'resolution-badge resolved'
                            : 'resolution-badge unresolved'
                        }
                      >
                        {entry.reviewItem
                          .isDiscarded
                          ? 'Discarded'
                          : entry.isResolved
                            ? 'Resolved'
                            : 'Unresolved'}
                      </span>
                    </div>

                    <button
                      className="secondary-button compact-button review-button"
                      onClick={() =>
                        void handleSummaryJump(
                          entry.reviewItem
                            .id
                        )
                      }
                    >
                      Open Note
                    </button>
                  </div>

                  {entry.reviewItem
                    .isDiscarded ? (
                    <>
                      {entry.quickNote && (
                        <div className="summary-section">
                          <p>
                            {
                              entry.quickNote
                                .text
                            }
                          </p>
                        </div>
                      )}

                      <div className="summary-section">
                        <h3 className="subsection-title">Outcome</h3>

                        <p>
                          This Quick Note is
                          discarded and will
                          create no permanent
                          contribution.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="summary-section">
                      <h3 className="subsection-title">Destinations</h3>

                      {entry.destinations
                        .length === 0 ? (
                        <p className="review-help">
                          No destinations
                          selected.
                        </p>
                      ) : (
                        <div className="summary-destinations">
                          {entry.destinations.map(
                            (
                              destination
                            ) => (
                              <div
                                className="summary-destination"
                                key={
                                  destination.id
                                }
                              >
                                <strong>
                                  {getDestinationLabel(
                                    destination
                                  )}
                                </strong>

                                <p>
                                  {
                                    destination.text
                                  }
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          <div className="review-completion">
            <h2 className="section-title">Complete Review</h2>

            {allItemsResolved ? (
              <p className="review-help">
                All Quick Notes are
                resolved. Completing
                Review will commit the
                selected Journal, People,
                and Discovery
                contributions and close
                this Session.
              </p>
            ) : (
              <p className="review-help">
                Resolve all Quick Notes
                before completing Review.
                Currently{' '}
                {resolvedCount} of{' '}
                {items.length} are
                resolved.
              </p>
            )}

            {completionError && (
              <p className="form-error">
                {completionError}
              </p>
            )}

            <button
              className="primary-button"
              onClick={() =>
                void handleCompleteReview()
              }
              disabled={
                !allItemsResolved ||
                isCompleting
              }
            >
              {isCompleting
                ? 'Completing…'
                : 'Complete Review'}
            </button>
          </div>
        </div>
      </main>
    )
  }

    const visibleCategories =
    categories.filter(
      (category, index, allCategories) =>
        allCategories.findIndex(
          (candidate) =>
            candidate.name
              .trim()
              .toLowerCase() ===
            category.name
              .trim()
              .toLowerCase()
        ) === index
    )

  const visibleDraftCategories =
    draftCategories.filter(
      (draftCategory, index, allDraftCategories) => {
        const normalizedName =
          draftCategory.name
            .trim()
            .toLowerCase()

        const alreadyPermanent =
          visibleCategories.some(
            (category) =>
              category.name
                .trim()
                .toLowerCase() ===
              normalizedName
          )

        const firstDraftIndex =
          allDraftCategories.findIndex(
            (category) =>
              category.name
                .trim()
                .toLowerCase() ===
              normalizedName
          )

        return (
          !alreadyPermanent &&
          firstDraftIndex === index
        )
      }
    )

  return (
    <main
      className="review-workspace"
      style={textureVariables}
    >
      <div className="review-header">
        <div>
          <strong>
            Session{' '}
            {session.sessionNumber}
          </strong>

          <span className="review-position">
            Quick Note{' '}
            {currentIndex + 1} of{' '}
            {items.length}
          </span>

          <span className="review-position">
            Resolved{' '}
            {resolvedCount} of{' '}
            {items.length}
          </span>
        </div>
      </div>

      <div className="review-panel">
        <div className="review-title-row">
          <h1 className="page-title">
            Session Review
          </h1>

          <div className="page-heading-actions">
            <span
              className={
                currentItemResolved
                  ? 'resolution-badge resolved'
                  : 'resolution-badge unresolved'
              }
            >
              {currentItemResolved
                ? 'Resolved'
                : 'Unresolved'}
            </span>

            <GuideHelpButton topicId="review" />
          </div>
        </div>

        <div className="review-block">
          <h2 className="section-title">Original Quick Note</h2>

          <p className="original-note">
            {sourceNote.text}
          </p>
        </div>

        <div className="review-block">
          <h2 className="section-title">Destinations</h2>

          {isLoadingDestinations ? (
            <p className="review-help">
              Loading destinations…
            </p>
          ) : (
            <>
              <div>
                <h3 className="subsection-title">Journal</h3>

                {journalDestination ? (
                  <div className="destination-card">
                    <div className="destination-heading">
                      <span />

                      <button
                        className="text-button"
                        onClick={() =>
                          void handleRemoveDestination(
                            journalDestination.id
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <textarea
                      value={
                        journalDestination.text
                      }
                      onChange={(event) =>
                        handleDestinationTextChange(
                          journalDestination.id,
                          event.target.value
                        )
                      }
                    />
                  </div>
                ) : (
                  <button
                    className="primary-button compact-button destination-add"
                    onClick={() =>
                      void handleAddJournal()
                    }
                  >
                    + Add to Journal
                  </button>
                )}
              </div>

              <div className="person-destinations">
                <h3 className="subsection-title">People</h3>

                {personDestinations.map(
                  (destination) => (
                    <div
                      className="destination-card"
                      key={
                        destination.id
                      }
                    >
                      <div className="destination-heading">
                        <strong>
                          {getPersonLabel(
                            destination
                          )}
                        </strong>

                        <button
                          className="text-button destination-remove"
                          onClick={() =>
                            void handleRemoveDestination(
                              destination.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={
                          destination.text
                        }
                        onChange={(event) =>
                          handleDestinationTextChange(
                            destination.id,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )
                )}

                {!showPersonPicker ? (
                  <button
                    className="primary-button compact-button destination-add"
                    onClick={() =>
                      setShowPersonPicker(
                        true
                      )
                    }
                  >
                    + Add to Person
                  </button>
                ) : (
                  <div className="person-picker">
                    <h4>
                      Choose Person
                    </h4>

                    {people.length >
                      0 && (
                      <>
                        <p className="review-help">
                          Existing People
                        </p>

                        <div className="person-picker-list">
                          {people.map(
                            (person) => (
                              <button
                                key={
                                  person.id
                                }
                                className="person-picker-item"
                                onClick={() =>
                                  void handleAddPermanentPerson(
                                    person
                                  )
                                }
                              >
                                {
                                  person.name
                                }
                              </button>
                            )
                          )}
                        </div>
                      </>
                    )}

                    {draftPeople.length >
                      0 && (
                      <>
                        <p className="review-help">
                          New in this Review
                        </p>

                        <div className="person-picker-list">
                          {draftPeople.map(
                            (
                              draftPerson
                            ) => (
                              <button
                                key={
                                  draftPerson.id
                                }
                                className="person-picker-item"
                                onClick={() =>
                                  void handleAddDraftPerson(
                                    draftPerson
                                  )
                                }
                              >
                                {
                                  draftPerson.name
                                }{' '}
                                — New
                              </button>
                            )
                          )}
                        </div>
                      </>
                    )}

                    {people.length ===
                      0 &&
                      draftPeople.length ===
                        0 && (
                        <p className="review-help">
                          No People exist
                          yet.
                        </p>
                      )}

                    <div className="new-person-box">
                      <label htmlFor="new-person-name">
                        Create New Person
                      </label>

                      <input
                        id="new-person-name"
                        value={
                          newPersonName
                        }
                        onChange={(event) =>
                          setNewPersonName(
                            event.target.value
                          )
                        }
                        placeholder="Person name"
                      />

                      <button
                        className="primary-button compact-button destination-add"
                        onClick={() =>
                          void handleCreateDraftPerson()
                        }
                      >
                        Create and Add
                      </button>

                      <p className="review-help">
                        A new Person created
                        here remains
                        temporary until
                        Review is completed.
                      </p>
                    </div>

                    {personError && (
                      <p className="form-error">
                        {personError}
                      </p>
                    )}

                    <button
                      className="secondary-button compact-button review-picker-cancel"
                      onClick={() => {
                        setShowPersonPicker(
                          false
                        )

                        setPersonError('')

                        setNewPersonName(
                          ''
                        )
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="discovery-destinations">
                <h3 className="subsection-title">Discoveries</h3>

                {discoveryDestinations.map(
                  (destination) => (
                    <div
                      className="destination-card"
                      key={
                        destination.id
                      }
                    >
                      <div className="destination-heading">
                        <strong>
                          {getDiscoveryLabel(
                            destination
                          )}
                        </strong>

                        <button
                          className="text-button destination-remove"
                          onClick={() =>
                            void handleRemoveDestination(
                              destination.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={
                          destination.text
                        }
                        onChange={(event) =>
                          handleDestinationTextChange(
                            destination.id,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )
                )}

                {!showDiscoveryPicker ? (
                  <button
                    className="primary-button compact-button destination-add"
                    onClick={() =>
                      setShowDiscoveryPicker(
                        true
                      )
                    }
                  >
                    + Add to Discovery
                  </button>
                ) : (
                  <div className="discovery-picker">
                    <h4>
                      Choose Discovery
                    </h4>

                    {discoveries.length >
                      0 && (
                      <>
                        <p className="review-help">
                          Existing
                          Discoveries
                        </p>

                        <div className="person-picker-list">
                          {discoveries.map(
                            (
                              discovery
                            ) => (
                              <button
                                key={
                                  discovery.id
                                }
                                className="person-picker-item"
                                onClick={() =>
                                  void handleAddPermanentDiscovery(
                                    discovery
                                  )
                                }
                              >
                                {
                                  discovery.title
                                }{' '}
                                —{' '}
                                {getCategoryName(
                                  discovery.categoryId
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </>
                    )}

                    {draftDiscoveries.length >
                      0 && (
                      <>
                        <p className="review-help">
                          New in this Review
                        </p>

                        <div className="person-picker-list">
                          {draftDiscoveries.map(
                            (
                              discovery
                            ) => {
                              const permanentCategory =
                                categories.find(
                                  (
                                    category
                                  ) =>
                                    category.id ===
                                    discovery.categoryRef
                                )

                              const draftCategory =
                                draftCategories.find(
                                  (
                                    category
                                  ) =>
                                    category.id ===
                                    discovery.categoryRef
                                )

                              const categoryName =
                                permanentCategory?.name ??
                                draftCategory?.name ??
                                'Unknown Category'

                              return (
                                <button
                                  key={
                                    discovery.id
                                  }
                                  className="person-picker-item"
                                  onClick={() =>
                                    void handleAddDraftDiscovery(
                                      discovery
                                    )
                                  }
                                >
                                  {
                                    discovery.title
                                  }{' '}
                                  —{' '}
                                  {
                                    categoryName
                                  }{' '}
                                  — New
                                </button>
                              )
                            }
                          )}
                        </div>
                      </>
                    )}

                    {discoveries.length ===
                      0 &&
                      draftDiscoveries.length ===
                        0 && (
                        <p className="review-help">
                          No Discoveries
                          exist yet.
                        </p>
                      )}

                    <div className="new-discovery-box">
                      <h4>
                        Create New
                        Discovery
                      </h4>

                      <label htmlFor="new-discovery-title">
                        Title
                      </label>

                      <input
                        id="new-discovery-title"
                        value={
                          newDiscoveryTitle
                        }
                        onChange={(event) =>
                          setNewDiscoveryTitle(
                            event.target.value
                          )
                        }
                        placeholder="Discovery title"
                      />

                      <label htmlFor="discovery-category">
                        Category
                      </label>

                      <select
                        id="discovery-category"
                        value={
                          selectedCategoryRef
                        }
                        onChange={(event) =>
                          setSelectedCategoryRef(
                            event.target.value
                          )
                        }
                      >
                        {visibleCategories.map(
                          (category) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >
                              {
                                category.name
                              }
                            </option>
                          )
                        )}

                        {visibleDraftCategories.map(
                          (category) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >
                              {
                                category.name
                              }{' '}
                              — New
                            </option>
                          )
                        )}
                      </select>

                      <button
                        className="primary-button compact-button destination-add"
                        onClick={() =>
                          void handleCreateDraftDiscovery()
                        }
                      >
                        Create and Add
                      </button>

                      <p className="review-help">
                        A new Discovery
                        created here remains
                        temporary until
                        Review is completed.
                      </p>
                    </div>

                    <div className="new-category-box">
                      <h4>
                        Create New Category
                      </h4>

                      <input
                        value={
                          newCategoryName
                        }
                        onChange={(event) =>
                          setNewCategoryName(
                            event.target.value
                          )
                        }
                        placeholder="Category name"
                      />

                      <button
                        className="primary-button compact-button destination-add"
                        onClick={() =>
                          void handleCreateDraftCategory()
                        }
                      >
                        Create Category
                      </button>

                      <p className="review-help">
                        A Category created
                        here remains
                        temporary until
                        Review completion
                        and is selected
                        automatically.
                      </p>
                    </div>

                    {discoveryError && (
                      <p className="form-error">
                        {discoveryError}
                      </p>
                    )}

                    <button
                      className="secondary-button compact-button review-picker-cancel"
                      onClick={() => {
                        setShowDiscoveryPicker(
                          false
                        )

                        setDiscoveryError(
                          ''
                        )

                        setNewDiscoveryTitle(
                          ''
                        )

                        setNewCategoryName(
                          ''
                        )
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="review-block">
          <div className="discard-row">
            <div>
              <h2 className="section-title">Discard</h2>

              <p className="review-help">
                Discard means this Quick
                Note will create no
                permanent contribution
                when Review is completed.
              </p>
            </div>

            <button
              className={
                currentItem.isDiscarded
                  ? 'discard-button active'
                  : 'discard-button'
              }
              onClick={() =>
                void handleDiscardToggle()
              }
            >
              {currentItem.isDiscarded
                ? 'Undo Discard'
                : 'Discard Quick Note'}
            </button>
          </div>
        </div>

        <div className="review-navigation">
          <button
            className="secondary-button"
            onClick={() =>
              void goToIndex(
                currentIndex - 1
              )
            }
            disabled={
              currentIndex === 0
            }
          >
            Previous
          </button>

          <button
            className="primary-button"
            onClick={() =>
              void handleNext()
            }
          >
            Next
          </button>
        </div>
        <div className="review-summary-action">
          <button
            className="secondary-button compact-button"
            onClick={handleBackToToday}
          >
            Back to Today
          </button>

          <button
            className="secondary-button compact-button review-button"
            onClick={() =>
              void handleOpenSummary()
            }
          >
            View Summary
          </button>
        </div>
      </div>

      <div id="modal-host" />
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
  onSessionTitleChange,
  onQuickNoteSaved,
  onOpenReview,
  onSwitchCampaign,
  onOpenGoals,
  onOpenReminders,
  onExportCampaign,
  onImportCampaign,
}: {
  campaign: Campaign
  activeSession:
    | Session
    | undefined
  quickNotes: QuickNote[]
  openReviews: Session[]
  onStartSession:
    () => Promise<void>
  onSessionTitleChange:
  (title: string) => Promise<void>
  onEndSession:
    () => Promise<void>
  onQuickNoteSaved:
    (quickNote: QuickNote) => void
  onOpenReview:
    (session: Session) => Promise<void>
  onSwitchCampaign: () => void
  onExportCampaign: () => Promise<void>
  onImportCampaign:
    (file: File) => Promise<void>
  onOpenGoals: () => void
  onOpenReminders: () => void
}) {
  const [
    isStarting,
    setIsStarting,
  ] = useState(false)

  const [
    isEnding,
    setIsEnding,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [
    showQuickNote,
    setShowQuickNote,
  ] = useState(false)

  const [
    goals,
    setGoals,
  ] = useState<Goal[]>([])

  const [
    reminders,
    setReminders,
  ] = useState<Reminder[]>([])

  useEffect(() => {
    async function loadTodayReferenceData() {
      const [
        goalResult,
        reminderResult,
      ] = await Promise.all([
        getGoals(campaign.id),
        getReminders(campaign.id),
      ])

      setGoals(
        goalResult.filter(
          (goal) =>
            goal.status === 'active'
        )
      )

      setReminders(
        reminderResult
      )
    }

    void loadTodayReferenceData()
  }, [campaign.id])

  async function handleStartSession() {
    try {
      setError('')
      setIsStarting(true)

      await onStartSession()
    } catch (error) {
      console.error(error)

      setError(
        'Session could not be started.'
      )
    } finally {
      setIsStarting(false)
    }
  }

  async function handleEndSession() {
    try {
      setError('')
      setIsEnding(true)

      await onEndSession()
    } catch (error) {
      console.error(error)

      setError(
        'Session could not be ended.'
      )
    } finally {
      setIsEnding(false)
    }
  }

  const shortGoal =
    goals.find(
      (goal) =>
        goal.term === 'short'
    )

  const midGoal =
    goals.find(
      (goal) =>
        goal.term === 'mid'
    )

  const longGoal =
    goals.find(
      (goal) =>
        goal.term === 'long'
    )

  const todayGoals = [
    {
      label: 'Short Term',
      goal: shortGoal,
    },
    {
      label: 'Mid Term',
      goal: midGoal,
    },
    {
      label: 'Long Term',
      goal: longGoal,
    },
  ]

  const visibleReminders =
    reminders.slice(0, 3)

  return (
    <>
      <section className="page left-page today-session-page distress-a">
                <div className="page-heading-with-status">
          <div>
            <h1 className="page-title">
              Today's Adventure
            </h1>

            <p className="section-title today-campaign-name">
              {campaign.name}
            </p>
          </div>

          <div className="page-heading-actions">
            <GuideHelpButton topicId="today" />
          </div>
        </div>

        <div className="page-section today-session-section">
          <h2 className="section-title">Session</h2>

        <div className="today-illustration">
          <img
            src={todayIllustration}
            alt=""
          />
        </div>

          {activeSession ? (
            <>
              <div className="today-session-status">
                <strong>
                  Session{' '}
                  {activeSession.sessionNumber}
                </strong>

                <span>
                  Active
                </span>
              </div>

              <input
                className="today-session-title"
                type="text"
                value={activeSession.title}
                onChange={(event) =>
                  void onSessionTitleChange(
                    event.target.value
                  )
                }
                placeholder="Session title"
              />

              <p className="session-note-count">
                Quick Notes:{' '}
                {quickNotes.length}
              </p>

              <button
                className="primary-button today-quick-note-button"
                onClick={() =>
                  setShowQuickNote(
                    true
                  )
                }
              >
                Quick Note
              </button>

              <div className="today-end-session-area">
                <button
                  className="secondary-button today-end-session-button"
                  onClick={
                    handleEndSession
                  }
                  disabled={isEnding}
                >
                  {isEnding
                    ? 'Ending…'
                    : 'End Session'}
                </button>
              </div>
            </>
          ) : openReviews.length >
            0 ? (
            <>
              <div className="open-reviews">
                <h3 className="subsection-title">Open Reviews</h3>

                {openReviews.map(
                  (session) => (
                    <div
                      className="review-card"
                      key={
                        session.id
                      }
                    >
                      <strong>
                        Session{' '}
                        {
                          session.sessionNumber
                        }
                      </strong>

                      <span>
                        {session.status ===
                        'reviewing'
                          ? 'In progress'
                          : 'Ready for review'}
                      </span>

                      <button
                        className="secondary-button compact-button review-button"
                        onClick={() =>
                          onOpenReview(
                            session
                          )
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

              <div className="today-new-session-area">
                <button
                  className="primary-button"
                  onClick={
                    handleStartSession
                  }
                  disabled={
                    isStarting
                  }
                >
                  {isStarting
                    ? 'Starting…'
                    : 'Start New Session'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                No session is
                currently active.
              </p>

              <button
                className="primary-button"
                onClick={
                  handleStartSession
                }
                disabled={
                  isStarting
                }
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

      <section className="page right-page today-reference-page distress-d">
        <div className="page-section today-goals-section">
          <div className="today-section-heading">
            <h2 className="section-title">Active Goals</h2>

            <button
              type="button"
              className="text-button"
              onClick={onOpenGoals}
            >
              View all
            </button>
          </div>

          <div className="today-goal-list">
            {todayGoals.map(
              ({
                label,
                goal,
              }) => (
                <div
                  className="today-goal-item"
                  key={label}
                >
                  <strong className="subsection-title today-item-title">
                    {label}
                  </strong>

                  {goal ? (
                    <span>
                      {goal.title ||
                        'Untitled Goal'}
                    </span>
                  ) : (
                    <span className="empty-message">
                      No active goal.
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div className="page-section today-reminders-section">
          <div className="today-section-heading">
            <h2 className="section-title">Reminders</h2>

            <button
              type="button"
              className="text-button"
              onClick={
                onOpenReminders
              }
            >
              View all
            </button>
          </div>

          {visibleReminders.length >
          0 ? (
            <div className="today-reminder-list">
              {visibleReminders.map(
                (reminder) => (
                  <div
                    className="today-reminder-item"
                    key={reminder.id}
                  >
                    <strong className="subsection-title today-item-title">
                      {reminder.title ||
                        'Untitled Reminder'}
                    </strong>

                    {reminder.todaySummary && (
                      <span>
                        {reminder.todaySummary}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="empty-message">
              No Reminders yet.
            </p>
          )}
        </div>

        <div className="today-switch-campaign">
          <button
            className="text-button switch-campaign-button"
            onClick={onSwitchCampaign}
          >
            Switch Campaign
          </button>

          <button
            className="text-button switch-campaign-button"
            onClick={() =>
              void onExportCampaign()
            }
          >
            Export Campaign
          </button>

          <label className="text-button switch-campaign-button">
            Import Campaign

            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                const file =
                  event.target.files?.[0]

                if (!file) {
                  return
                }

                void onImportCampaign(
                  file
                )

                event.target.value = ''
              }}
            />
          </label>
        </div>
      </section>

      {showQuickNote &&
        activeSession && (
          <QuickNoteModal
            session={
              activeSession
            }
            onClose={() =>
              setShowQuickNote(
                false
              )
            }
            onSaved={(quickNote) => {
              onQuickNoteSaved(
                quickNote
              )

              setShowQuickNote(
                false
              )
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

        <p className="empty-message">
          This section will be
          built in a later stage.
        </p>
      </section>

      <section className="page right-page">
        <div className="page-section">
          <h2>
            Coming soon
          </h2>

          <p className="empty-message">
            The Campaign Guide
            foundation is working.
          </p>
        </div>
      </section>
    </>
  )
}

function CampaignSetup({
  onCreated,
  onImportCampaign,
  onCancel,
}: {
  onCreated:
    (campaign: Campaign) => void

  onImportCampaign:
    (file: File) => Promise<void>

  onCancel: () => void
}) {
  const [name, setName] =
    useState('')

  const [error, setError] =
    useState('')

  const [
    isCreating,
    setIsCreating,
  ] = useState(false)

  async function handleCreate() {
    setError('')

    if (!name.trim()) {
      setError(
        'Campaign name is required.'
      )
      return
    }

    try {
      setIsCreating(true)

      const campaign =
        await createCampaign(
          name
        )

      onCreated(campaign)
    } catch (error) {
  console.error(
    'Could not create campaign.',
    error
  )

  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error)

  setError(
    `Campaign could not be created. ${message}`
  )
} finally {
      setIsCreating(false)
    }
  }

  return (
    <main
      className="setup-screen"
      style={textureVariables}
    >
      <div className="setup-card">
        <div className="setup-content">
          <h1>
            Welcome to Campaign Guide
          </h1>

          <p>
            Keep your sessions,
            character, people,
            discoveries, goals, and
            during-play notes together
            in one place.
          </p>

          <label htmlFor="campaign-name">
            Campaign Name
          </label>

          <input
            id="campaign-name"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
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
          <label className="secondary-button compact-button setup-import-button">
            Import Existing Campaign

            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                const file =
                  event.target.files?.[0]

                if (!file) {
                  return
                }

                void onImportCampaign(
                  file
                )

                event.target.value = ''
              }}
            />
          </label>
          <button
            type="button"
            className="secondary-button compact-button setup-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  )
}

function CampaignChooser({
  campaigns,
  onSelect,
  onCreated,
  onImportCampaign,
  onDelete,
}: {
  campaigns: Campaign[]
  onSelect:
    (campaign: Campaign) => void
  onCreated:
    (campaign: Campaign) => void
  onImportCampaign:
    (file: File) => Promise<void>
  onDelete:
    (campaign: Campaign) => Promise<void>
}) {
  const [
    showCreate,
    setShowCreate,
  ] = useState(false)

  if (showCreate) {
    return (
      <CampaignSetup
        onCreated={(campaign) => {
          onCreated(campaign)
        }}
        onImportCampaign={
          onImportCampaign
        }
        onCancel={() =>
          setShowCreate(false)
        }
      />
    )
  }

  return (
    <main
      className="setup-screen"
      style={textureVariables}
    >
      <div className="setup-card">
        <div className="setup-content">
          <h1>
            Campaign Guide
          </h1>

          <p>
            Choose a campaign to continue.
          </p>

          <div className="campaign-choice-list">
            {campaigns.map(
              (campaign) => (
                <div
                  key={campaign.id}
                  className="campaign-choice-row"
                >
                  <button
                    className="campaign-choice-button"
                    onClick={() =>
                      onSelect(campaign)
                    }
                  >
                    {campaign.name}
                  </button>

                  <button
                    type="button"
                    className="destructive-button campaign-delete-button"
                    onClick={() => {
                      void onDelete(campaign)
                    }}
                  >
                    Delete
                  </button>
                </div>
              )
            )}
          </div>

          <button
            className="primary-button setup-button"
            onClick={() =>
              setShowCreate(true)
            }
          >
            Create New Campaign
          </button>

          <label className="secondary-button compact-button setup-import-button">
            Import Existing Campaign

            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                const file =
                  event.target.files?.[0]

                if (!file) {
                  return
                }

                void onImportCampaign(file)

                event.target.value = ''
              }}
            />
          </label>

          <div className="setup-illustration">
            <img
              src={todayIllustration}
              alt=""
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function CampaignApp({
  campaign,
  onSwitchCampaign,
  onImportCampaign,
}: {
  campaign: Campaign
  onSwitchCampaign: () => void
  onImportCampaign:
    (file: File) => Promise<void>
}) {
  const [
    activeSection,
    setActiveSection,
  ] =
    useState<Section>(
      'today'
    )

  const [
    journalSessionId,
    setJournalSessionId,
  ] = useState<string | undefined>()

  function openJournalSession(
    sessionId: string
  ) {
    setJournalSessionId(undefined)

    window.setTimeout(() => {
      setJournalSessionId(sessionId)
      setActiveSection('journal')
    }, 0)
  }

  const bookWrapperRef =
    useRef<HTMLDivElement>(null)

  const [bookScale, setBookScale] =
    useState(1)

  useEffect(() => {
    const updateScale = () => {
      const designWidth = 1497
      const designHeight = 850

      const horizontalMargin = 40
      const verticalMargin = 5

      const widthScale =
        (window.innerWidth -
          horizontalMargin) /
        designWidth

      const heightScale =
        (window.innerHeight -
          verticalMargin) /
        designHeight

      const fitScale = Math.min(
        widthScale,
        heightScale,
        1
      )

      const nextScale = fitScale * 0.9999   

      setBookScale(nextScale)
    }

    updateScale()

    window.addEventListener(
      'resize',
      updateScale
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateScale
      )
    }
  }, [])

  const [
    activeSession,
    setActiveSession,
  ] =
    useState<
      Session | undefined
    >()

  const [
    quickNotes,
    setQuickNotes,
  ] =
    useState<
      QuickNote[]
    >([])

  const [
    openReviews,
    setOpenReviews,
  ] =
    useState<
      Session[]
    >([])

  const [
    reviewSession,
    setReviewSession,
  ] =
    useState<
      Session | undefined
    >()

  const [
    reviewDraft,
    setReviewDraft,
  ] =
    useState<
      ReviewDraft | undefined
    >()

  const [
    reviewItems,
    setReviewItems,
  ] =
    useState<
      ReviewItem[]
    >([])

  const [
    reviewQuickNotes,
    setReviewQuickNotes,
  ] =
    useState<
      QuickNote[]
    >([])

  const [
    isLoadingSession,
    setIsLoadingSession,
  ] =
    useState(true)

  useEffect(() => {
    async function loadSessionState() {
      const session =
        await getActiveSession(
          campaign.id
        )

      setActiveSession(
        session
      )

      if (session) {
        const notes =
          await getQuickNotesForSession(
            session.id
          )

        setQuickNotes(
          notes
        )

        setOpenReviews([])
      } else {
        setQuickNotes([])

        const reviews =
          await getOpenReviews(
            campaign.id
          )

        setOpenReviews(
          reviews
        )
      }

      setIsLoadingSession(
        false
      )
    }

    void loadSessionState()
  }, [campaign.id])

  async function handleStartSession() {
    const newSession =
      await startSession(
        campaign.id
      )

    setActiveSession(
      newSession
    )

    setQuickNotes([])
    setOpenReviews([])
  }

  async function handleSessionTitleChange(
    title: string
  ) {
    if (!activeSession) {
      return
    }

    const updatedSession =
      await updateSessionTitle(
        activeSession.id,
        title
      )

    if (updatedSession) {
      setActiveSession(
        updatedSession
      )
    }
  }

  async function handleEndSession() {
    if (!activeSession) {
      return
    }

    await endSession(
      activeSession.id
    )

    setActiveSession(
      undefined
    )

    setQuickNotes([])

    const reviews =
      await getOpenReviews(
        campaign.id
      )

    setOpenReviews(
      reviews
    )
  }

  async function handleExportCampaign() {
    try {
      const backup =
        await exportCampaign(
          campaign.id
        )

      const json =
        JSON.stringify(
          backup,
          null,
          2
        )

      const blob =
        new Blob(
          [json],
          {
            type: 'application/json',
          }
        )

      const url =
        URL.createObjectURL(blob)

      const link =
        document.createElement('a')

      const safeCampaignName =
        campaign.name
          .trim()
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .toLowerCase()

      const date =
        new Date()
          .toISOString()
          .slice(0, 10)

      link.href = url

      link.download =
        `${safeCampaignName || 'campaign'}-${date}.json`

      document.body.appendChild(
        link
      )

      link.click()

      link.remove()

      URL.revokeObjectURL(
        url
      )
    } catch (error) {
      console.error(
        'Campaign export failed.',
        error
      )
    }
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

    setReviewQuickNotes(
      notes
    )

    const reviews =
      await getOpenReviews(
        campaign.id
      )

    setOpenReviews(
      reviews
    )
  }

  function closeReview() {
    setReviewSession(
      undefined
    )

    setReviewDraft(
      undefined
    )

    setReviewItems([])

    setReviewQuickNotes(
      []
    )
  }

  async function handleReviewCompleted() {
    setReviewSession(
      undefined
    )

    setReviewDraft(
      undefined
    )

    setReviewItems([])

    setReviewQuickNotes(
      []
    )

    setActiveSection(
      'today'
    )

    const active =
      await getActiveSession(
        campaign.id
      )

    setActiveSession(
      active
    )

    if (active) {
      const notes =
        await getQuickNotesForSession(
          active.id
        )

      setQuickNotes(
        notes
      )

      setOpenReviews([])
    } else {
      setQuickNotes([])

      const reviews =
        await getOpenReviews(
          campaign.id
        )

      setOpenReviews(
        reviews
      )
    }
  }

  if (
    reviewSession &&
    reviewDraft
  ) {


    
    return (
      <ReviewScreen
        session={
          reviewSession
        }
        reviewDraft={
          reviewDraft
        }
        reviewItems={
          reviewItems
        }
        quickNotes={
          reviewQuickNotes
        }
        onClose={
          closeReview
        }
        onCompleted={
          handleReviewCompleted
        }
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
        section.id ===
        activeSection
    )?.label ?? 'Today'

  return (
    <div
  className="app"
  style={textureVariables}
>
  <div
  className="book-scale-space"
  style={{
    width: `${1497 * bookScale}px`,
    height: `${850 * bookScale}px`,
  }}
>
  <div
    ref={bookWrapperRef}
    className="book-scale-wrapper"
    style={{
      transform: `scale(${bookScale})`,
    }}
  >
    <nav className="sidebar">
      {sections.map((section) => {
        const Icon =
          sectionIcons[
            section.id as keyof typeof sectionIcons
          ]

        return (
          <button
            key={section.id}
            className={
              activeSection === section.id
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() =>
              setActiveSection(section.id)
            }
          >
            {Icon && (
              <Icon
                className="nav-icon"
                aria-hidden="true"
              />
            )}

            <span className="nav-label">
              {section.label}
            </span>
          </button>
        )
      })}
    </nav>

    <main className="book-area">
      <div className="book">
        {activeSection === 'today' ? (
          <TodayPage
            campaign={campaign}
            onSwitchCampaign={onSwitchCampaign}
            activeSession={activeSession}
            quickNotes={quickNotes}
            openReviews={openReviews}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onSessionTitleChange={handleSessionTitleChange}
            onExportCampaign={handleExportCampaign}
            onImportCampaign={onImportCampaign}
            onQuickNoteSaved={(quickNote) =>
              setQuickNotes((current) => [
                ...current,
                quickNote,
              ])
            }
            onOpenReview={handleOpenReview}
            onOpenGoals={() =>
              setActiveSection('goals')
            }
            onOpenReminders={() =>
              setActiveSection('reminders')
            }
          />
        ) : activeSection === 'character' ? (
          <CharacterPage
            campaign={campaign}
          />
        ) : activeSection === 'characterModule' ? (
          <CharacterModulePage
            campaign={campaign}
          />
        ) : activeSection === 'goals' ? (
          <GoalsPage
            campaign={campaign}
          />
        ) : activeSection === 'people' ? (
          <PeoplePage
            campaign={campaign}
            onOpenSession={openJournalSession}
          />
        ) : activeSection === 'discoveries' ? (
          <DiscoveriesPage
            campaign={campaign}
            onOpenSession={openJournalSession}
          />
        ) : activeSection === 'journal' ? (
          <JournalPage
            campaign={campaign}
            initialSessionId={journalSessionId}
          />
        ) : activeSection === 'reminders' ? (
          <RemindersPage
            campaign={campaign}
          />
        ) : activeSection === 'guide' ? (
          <GuidePage />
        ) : (
          <PlaceholderPage
            title={activeLabel}
          />
        )}
      </div>
    </main>
    <div id="modal-host" />
  </div>
</div>
</div>
  )
}

function App() {
  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      Campaign[]
    >([])

  const [
    campaign,
    setCampaign,
  ] =
    useState<
      Campaign | undefined
    >()

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  useEffect(() => {
    async function loadCampaigns() {
      const existingCampaigns =
        await getCampaigns()

      setCampaigns(
        existingCampaigns
      )

      setIsLoading(
        false
      )
    }

    void loadCampaigns()
  }, [])

async function handleImportCampaign(
    file: File
  ) {
    try {
      const text =
        await file.text()

      const backup =
        JSON.parse(text)

      const result =
        await importCampaign(
          backup
        )

      if (
        result.status ===
        'campaign_exists'
      ) {
        const shouldReplace =
          window.confirm(
            `Campaign "${result.campaign.name}" already exists on this device.\n\nReplace the existing campaign with this backup?\n\nThis will remove the locally stored version and restore the imported version.`
          )

        if (!shouldReplace) {
          return
        }

        const restoredCampaign =
          await replaceCampaignFromBackup(
            backup
          )

        setCampaigns(
          await getCampaigns()
        )

        setCampaign(
          restoredCampaign
        )

        alert(
          `Campaign "${restoredCampaign.name}" restored successfully.`
        )

        return
      }

      setCampaigns(
        await getCampaigns()
      )

      setCampaign(
        result.campaign
      )

      alert(
        `Campaign "${result.campaign.name}" imported successfully.`
      )
    } catch (error) {
      console.error(
        'Campaign import failed.',
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Campaign import failed.'
      )
    }
  }

  async function handleDeleteCampaign(
    campaignToDelete: Campaign
  ) {
    const shouldDelete =
      window.confirm(
        `Delete "${campaignToDelete.name}"?\n\nThis permanently deletes the campaign and all of its locally stored data.\n\nThis cannot be undone.`
      )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteCampaign(
        campaignToDelete.id
      )

      setCampaigns(
        await getCampaigns()
      )
    } catch (error) {
      console.error(
        'Campaign deletion failed.',
        error
      )

      alert(
        'Campaign could not be deleted.'
      )
    }
  }

  if (isLoading) {
    return (
      <main className="loading-screen">
        Loading Campaign Guide…
      </main>
    )
  }

  if (!campaign) {
    return (
      <CampaignChooser
        campaigns={campaigns}
        onSelect={setCampaign}
        onDelete={handleDeleteCampaign}
        onImportCampaign={handleImportCampaign}
        onCreated={(newCampaign) => {
          setCampaigns(
            (current) => [
              ...current,
              newCampaign,
            ]
          )

          setCampaign(
            newCampaign
          )
        }}
      />
    )
  }

  return (
    <CampaignApp
      campaign={campaign}
      onSwitchCampaign={() =>
        setCampaign(undefined)
      }
      onImportCampaign={
        handleImportCampaign
      }
    />
  )
}

export default App