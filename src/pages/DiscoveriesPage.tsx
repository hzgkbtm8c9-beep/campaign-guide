import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  deleteDiscovery,
  getDiscoveries,
  getDiscoveryCategories,
  getNoteContributions,
  getSession,
  getSessionsForEntry,
  mergeDiscoveries,
  updateDiscoveryNotes,
  updateDiscoveryTitle,
  updateDiscoveryCategory,
  createDiscoveryCategory,
  renameDiscoveryCategory,
  deleteDiscoveryCategory,
  getDiscoveryCategoryUsage,
} from '../data/repository'

import type {
  Campaign,
  Discovery,
  DiscoveryCategory,
  Session,
} from '../data/database'

import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'


import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

import GuideHelpButton from '../components/GuideHelpButton'
import ConfirmModal from '../components/ConfirmModal'

export default function DiscoveriesPage({
  campaign,
  onOpenSession,
}: {
  campaign: Campaign
  onOpenSession: (
    sessionId: string
  ) => void
}) {
  const [
    discoveries,
    setDiscoveries,
  ] = useState<Discovery[]>([])

  const [
    categories,
    setCategories,
  ] = useState<DiscoveryCategory[]>([])

  const [
    selectedDiscoveryId,
    setSelectedDiscoveryId,
  ] = useState<string | undefined>()

  const [
    discoveryPendingDeletion,
    setDiscoveryPendingDeletion,
  ] = useState<Discovery | null>(null)

  const [
    isDeletingDiscovery,
    setIsDeletingDiscovery,
  ] = useState(false)

  const [
    relatedSessions,
    setRelatedSessions,
  ] = useState<Session[]>([])

  const [
    firstDiscoveredSession,
    setFirstDiscoveredSession,
  ] = useState<Session | undefined>()

  const [
    titleDraft,
    setTitleDraft,
  ] = useState('')

  const [
    notesDraft,
    setNotesDraft,
  ] = useState('')

  const notesEditorRef =
    useRef<HTMLTextAreaElement | null>(
      null
    )

  const [
    mergeTargetId,
    setMergeTargetId,
  ] = useState('')

  const [
    showMergePreview,
    setShowMergePreview,
  ] = useState(false)

  const [
    mergePreviewNotes,
    setMergePreviewNotes,
  ] = useState('')

  const [
    showAllSessions,
    setShowAllSessions,
  ] = useState(false)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    collapsedCategoryIds,
    setCollapsedCategoryIds,
  ] = useState<Set<string>>(
    () => new Set()
  )

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState<string | null>(
    null
  )

  const [
    categoryNameDraft,
    setCategoryNameDraft,
  ] = useState('')

  const [
    isAddingCategory,
    setIsAddingCategory,
  ] = useState(false)

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState('')

  const [
    deleteCategoryId,
    setDeleteCategoryId,
  ] = useState('')

  const [
    deleteCategoryUsage,
    setDeleteCategoryUsage,
  ] = useState<{
    permanentDiscoveries: number
    reviewDraftDiscoveries: number
    total: number
  } | null>(null)

  const [
    showDeleteCategoryModal,
    setShowDeleteCategoryModal,
  ] = useState(false)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [saveStatus, setSaveStatus] =
  useState<SaveStatusState>('saved')

  useEffect(() => {
    async function loadDiscoveries() {
      const [
        discoveryResult,
        categoryResult,
      ] = await Promise.all([
        getDiscoveries(campaign.id),
        getDiscoveryCategories(
          campaign.id
        ),
      ])

      setDiscoveries(
        discoveryResult
      )

      setCategories(
        categoryResult
      )

      if (
        discoveryResult.length > 0
      ) {
        setSelectedDiscoveryId(
          discoveryResult[0].id
        )
      }

      setIsLoading(false)
    }

    void loadDiscoveries()
  }, [campaign.id])

  useEffect(() => {
    if (categories.length === 0) {
      return
    }

    setCollapsedCategoryIds(
      (current) => {
        if (current.size > 0) {
          return current
        }

        return new Set(
          categories.map(
            (category) => category.id
          )
        )
      }
    )
  }, [categories])

  const selectedDiscovery =
    discoveries.find(
      (discovery) =>
        discovery.id ===
        selectedDiscoveryId
    )

  const mergeTarget =
    discoveries.find(
      (discovery) =>
        discovery.id ===
        mergeTargetId
    )

  useEffect(() => {
    async function loadSessionInfo() {
      if (!selectedDiscovery) {
        setRelatedSessions([])
        setFirstDiscoveredSession(
          undefined
        )
        setTitleDraft('')
        setNotesDraft('')
        setMergeTargetId('')
        return
      }

      const [
        contributionSessions,
        contributions,
      ] = await Promise.all([
        getSessionsForEntry(
          campaign.id,
          'discovery',
          selectedDiscovery.id
        ),

        getNoteContributions(
          'discovery',
          selectedDiscovery.id
        ),
      ])

      let discoveredSession:
        | Session
        | undefined

      if (
        selectedDiscovery
          .discoveredInSessionId
      ) {
        discoveredSession =
          contributionSessions.find(
            (session) =>
              session.id ===
              selectedDiscovery
                .discoveredInSessionId
          )

        if (!discoveredSession) {
          discoveredSession =
            await getSession(
              selectedDiscovery
                .discoveredInSessionId
            )
        }
      }

      setFirstDiscoveredSession(
        discoveredSession
      )

      setTitleDraft(
        selectedDiscovery.title
      )

      const contributionText =
        contributions
          .map(
            (contribution) =>
              contribution.text
          )
          .filter(Boolean)
          .join('\n')

      setNotesDraft(
        selectedDiscovery.notes ||
          contributionText
      )

      const combinedSessions =
        discoveredSession
          ? [
              discoveredSession,
              ...contributionSessions,
            ]
          : contributionSessions

      const uniqueSessions =
        Array.from(
          new Map(
            combinedSessions.map(
              (session) => [
                session.id,
                session,
              ]
            )
          ).values()
        ).sort(
          (a, b) =>
            b.sessionNumber -
            a.sessionNumber
        )

      setRelatedSessions(
        uniqueSessions
      )

      setShowAllSessions(false)
    }

    void loadSessionInfo()
  }, [
    campaign.id,
    selectedDiscoveryId,
  ])

  useAutoGrowTextarea(
    notesEditorRef,
    notesDraft
  )

  useEffect(() => {
    if (!selectedDiscoveryId) {
      return
    }

    const trimmedTitle =
      titleDraft.trim()

    if (!trimmedTitle) {
      return
    }

    const timeout =
      window.setTimeout(async () => {
        try {
          setSaveStatus('saving')

          await updateDiscoveryTitle(
            selectedDiscoveryId,
            trimmedTitle
          )

          setDiscoveries(
            (current) =>
              current
                .map((discovery) =>
                  discovery.id ===
                  selectedDiscoveryId
                    ? {
                        ...discovery,
                        title:
                          trimmedTitle,
                      }
                    : discovery
                )
                .sort((a, b) =>
                  a.title.localeCompare(
                    b.title
                  )
                )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Discovery title.',
            error
          )
          setSaveStatus('error')
        }
      }, 400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    titleDraft,
    selectedDiscoveryId,
  ])

  useEffect(() => {
    if (!selectedDiscoveryId) {
      return
    }

    const timeout =
      window.setTimeout(async () => {
        try {
          setSaveStatus('saving')

          await updateDiscoveryNotes(
            selectedDiscoveryId,
            notesDraft
          )

          setDiscoveries(
            (current) =>
              current.map(
                (discovery) =>
                  discovery.id ===
                  selectedDiscoveryId
                    ? {
                        ...discovery,
                        notes:
                          notesDraft,
                      }
                    : discovery
              )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Discovery notes.',
            error
          )
          setSaveStatus('error')
        }
      }, 400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    notesDraft,
    selectedDiscoveryId,
  ])

  function toggleCategory(
    categoryId: string
  ) {
    setCollapsedCategoryIds(
      (current) => {
        const next =
          new Set(current)

        if (next.has(categoryId)) {
          next.delete(categoryId)
        } else {
          next.add(categoryId)
        }

        return next
      }
    )
  }

  function startRenamingCategory(
    categoryId: string,
    currentName: string
  ) {
    setEditingCategoryId(
      categoryId
    )
    setCategoryNameDraft(
      currentName
    )
  }

  function cancelRenamingCategory() {
    setEditingCategoryId(null)
    setCategoryNameDraft('')
  }

  async function saveCategoryName() {
    if (!editingCategoryId) {
      return
    }

    const trimmedName =
      categoryNameDraft.trim()

    if (!trimmedName) {
      return
    }

    await renameDiscoveryCategory(
      editingCategoryId,
      trimmedName
    )

    setCategories(
      await getDiscoveryCategories(
        campaign.id
      )
    )

    setEditingCategoryId(null)
    setCategoryNameDraft('')
  }

  async function addCategory() {
    const trimmedName =
      newCategoryName.trim()

    if (!trimmedName) {
      return
    }

    await createDiscoveryCategory(
      campaign.id,
      trimmedName
    )

    setCategories(
      await getDiscoveryCategories(
        campaign.id
      )
    )

    setNewCategoryName('')
    setIsAddingCategory(false)
  }

  const visibleSessions =
    showAllSessions
      ? relatedSessions
      : relatedSessions.slice(0, 3)

  /*
   * Search
   */
  const normalizedSearch =
  searchQuery
    .trim()
    .toLowerCase()

const filteredDiscoveries =
  normalizedSearch
    ? discoveries.filter(
        (discovery) => {
          const searchableText = [
            discovery.title,
            discovery.notes ?? '',
          ]
            .join(' ')
            .toLowerCase()

          return searchableText.includes(
            normalizedSearch
          )
        }
      )
    : discoveries

const groupedDiscoveries =
  categories
    .map(
      (category) => ({
        category,
        discoveries:
          filteredDiscoveries
            .filter(
              (discovery) =>
                discovery.categoryId ===
                category.id
            )
            .sort((a, b) =>
              a.title.localeCompare(
                b.title
              )
            ),
      })
    )
    .filter(
      (group) =>
        !normalizedSearch ||
        group.discoveries.length > 0
    )

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1 className="page-title">Discoveries</h1>

          <p className="subtitle">
            Loading Discoveries…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  return (
    <>
      <section className="page left-page distress-e discoveries-page">
        <div className="page-heading-with-status">
          <div className="page-heading-copy">
            <h1 className="page-title">
              Discoveries
            </h1>

            <p className="page-intro">
              Places, secrets, and things
              perhaps best left undisturbed.
            </p>
          </div>

                    <div className="page-heading-actions">
            <SaveStatus
              status={saveStatus}
            />

            <GuideHelpButton topicId="discoveries" />
          </div>
        </div>

        <input
          className="discoveries-search"
          type="search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          placeholder="Search Discoveries…"
        />

        {filteredDiscoveries.length ===
          0 && (
            <p className="empty-message">
              {discoveries.length === 0
                ? 'No Discoveries have been added yet.'
                : 'No matching Discoveries found.'}
            </p>
          )}

        <div className="discovery-category-list">
                {groupedDiscoveries.map(
                  ({
                    category,
                    discoveries:
                      categoryDiscoveries,
                  }) => {
                    const isSearching =
                      normalizedSearch.length > 0

                    const isCollapsed =
                      !isSearching &&
                      collapsedCategoryIds.has(
                        category.id
                      )

                    return (
                      <section
                        key={category.id}
                        className="discovery-category-group"
                      >
                        <div className="discovery-category-heading-row">
                          {editingCategoryId ===
                          category.id ? (
                            <div className="discovery-category-rename">
                              <input
                                className="discovery-category-rename-input"
                                value={categoryNameDraft}
                                onChange={(event) =>
                                  setCategoryNameDraft(
                                    event.target.value
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === 'Enter'
                                  ) {
                                    void saveCategoryName()
                                  }

                                  if (
                                    event.key === 'Escape'
                                  ) {
                                    cancelRenamingCategory()
                                  }
                                }}
                                autoFocus
                              />

                              <button
                                type="button"
                                className="primary-button compact-button discovery-category-rename-save"
                                onClick={() =>
                                  void saveCategoryName()
                                }
                              >
                                Save
                              </button>

                              <button
                                type="button"
                                className="secondary-button compact-button"
                                onClick={
                                  cancelRenamingCategory
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                className="discovery-category-toggle"
                                onClick={() =>
                                  toggleCategory(
                                    category.id
                                  )
                                }
                              >
                                <span className="discovery-category-heading">
                                  {category.name}
                                </span>

                                <span className="discovery-category-toggle-symbol">
                                  {isCollapsed
                                    ? '▸'
                                    : '▾'}
                                </span>
                              </button>

                              <button
                                type="button"
                                className="secondary-button compact-button discovery-category-rename-button"
                                onClick={() =>
                                  startRenamingCategory(
                                    category.id,
                                    category.name
                                  )
                                }
                              >
                                Rename
                              </button>
                            </>
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="discovery-list">
                            {categoryDiscoveries.map(
                              (discovery) => (
                                <button
                                  key={
                                    discovery.id
                                  }
                                  className={
                                    discovery.id ===
                                    selectedDiscoveryId
                                      ? 'discovery-list-item active'
                                      : 'discovery-list-item'
                                  }
                                  onClick={() =>
                                    setSelectedDiscoveryId(
                                      discovery.id
                                    )
                                  }
                                >
                                  <strong>
                                    {
                                      discovery.title
                                    }
                                  </strong>
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </section>
                    )
                  }
                )}
              </div>
              <div className="discovery-category-actions">
                {!isAddingCategory ? (
                  <>
                    <button
                      type="button"
                      className="primary-button compact-button discovery-category-add-button"
                      onClick={() => {
                        setIsAddingCategory(true)
                        setNewCategoryName('')
                      }}
                    >
                      + Add Category
                    </button>
                    <button
                      type="button"
                      className="secondary-button compact-button"
                      onClick={() => {
                        setDeleteCategoryId('')
                        setDeleteCategoryUsage(null)
                        setShowDeleteCategoryModal(true)
                      }}
                    >
                      Delete Category
                    </button>
                  </>
                ) : (
                  <div className="discovery-category-add">
                    <input
                      className="discovery-category-add-input"
                      value={newCategoryName}
                      onChange={(event) =>
                        setNewCategoryName(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter'
                        ) {
                          void addCategory()
                        }

                        if (
                          event.key === 'Escape'
                        ) {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                        }
                      }}
                      placeholder="Category name"
                      autoFocus
                    />

                    <button
                      type="button"
                      className="primary-button compact-button discovery-category-add-button"
                      onClick={() =>
                        void addCategory()
                      }
                    >
                      Add
                    </button>

                    <button
                      type="button"
                      className="secondary-button compact-button"
                      onClick={() => {
                        setIsAddingCategory(false)
                        setNewCategoryName('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {showDeleteCategoryModal && (
                  <div
                    className="discovery-merge-modal-backdrop"
                    onClick={() =>
                      setShowDeleteCategoryModal(
                        false
                      )
                    }
                  >
                    <div
                      className="discovery-merge-modal"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <h2 className="modal-title">Delete Category</h2>

                      <label>
                        Category

                        <select
                          className="record-select"
                          value={deleteCategoryId}
                          onChange={(event) => {
                            const categoryId =
                              event.target.value

                            setDeleteCategoryId(
                              categoryId
                            )

                            setDeleteCategoryUsage(
                              null
                            )

                            if (!categoryId) {
                              return
                            }

                            void getDiscoveryCategoryUsage(
                              categoryId
                            ).then((usage) => {
                              setDeleteCategoryUsage(
                                usage
                              )
                            })
                          }}
                        >
                          <option value="">
                            Select category…
                          </option>

                          {categories.map(
                            (category) => (
                              <option
                                key={category.id}
                                value={category.id}
                              >
                                {category.name}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      {deleteCategoryUsage &&
                        deleteCategoryUsage
                          .permanentDiscoveries >
                          0 && (
                        <p>
                          {
                            deleteCategoryUsage
                              .permanentDiscoveries
                          }{' '}
                          permanent{' '}
                          {deleteCategoryUsage
                            .permanentDiscoveries === 1
                            ? 'Discovery uses'
                            : 'Discoveries use'}{' '}
                          this category.
                          Change their categories
                          before deleting it.
                        </p>
                      )}

                      {deleteCategoryUsage &&
                        deleteCategoryUsage
                          .reviewDraftDiscoveries >
                          0 && (
                        <p>
                          {
                            deleteCategoryUsage
                              .reviewDraftDiscoveries
                          }{' '}
                          {deleteCategoryUsage
                            .reviewDraftDiscoveries === 1
                            ? 'Discovery in an unfinished Session Review uses'
                            : 'Discoveries in an unfinished Session Review use'}{' '}
                          this category.
                          Complete the Review or
                          change those draft
                          Discoveries first.
                        </p>
                      )}

                      {deleteCategoryUsage &&
                        deleteCategoryUsage.total ===
                          0 && (
                        <p>
                          This category is not
                          currently used by any
                          Discoveries. Delete it?
                        </p>
                      )}

                      <div className="discovery-merge-preview-actions">
                        <button
                          type="button"
                          className="secondary-button compact-button"
                          onClick={() =>
                            setShowDeleteCategoryModal(
                              false
                            )
                          }
                        >
                          Cancel
                        </button>

                        {deleteCategoryUsage &&
                          deleteCategoryUsage.total ===
                            0 && (
                          <button
                            type="button"
                            className="destructive-button"
                            onClick={() => {
                              void deleteDiscoveryCategory(
                                deleteCategoryId
                              ).then(async () => {
                                setCategories(
                                  await getDiscoveryCategories(
                                    campaign.id
                                  )
                                )

                                setDeleteCategoryId(
                                  ''
                                )

                                setDeleteCategoryUsage(
                                  null
                                )

                                setShowDeleteCategoryModal(
                                  false
                                )
                              })
                            }}
                          >
                            Delete Category
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
      </section>

      <section className="page right-page distress-b discoveries-page discovery-detail-page">
        {selectedDiscovery ? (
          <>
            <div className="discovery-heading-row">
              <input
                className="discovery-title-editor"
                value={titleDraft}
                onChange={(event) =>
                  setTitleDraft(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="destructive-button discovery-delete-button"
                onClick={() =>
                  setDiscoveryPendingDeletion(
                    selectedDiscovery
                  )
                }
              >
                Delete Discovery
              </button>
            </div>

            <div className="discovery-top-meta-row">
              <label className="discovery-category-field">
                <span className="section-title discovery-category-field-heading">
                  Category
                </span>

                <select
                  className="record-select"
                  value={
                    selectedDiscovery.categoryId
                  }
                  onChange={(event) => {
                    const categoryId =
                      event.target.value

                    void updateDiscoveryCategory(
                      selectedDiscovery.id,
                      categoryId
                    ).then(() => {
                      setDiscoveries(
                        (current) =>
                          current.map(
                            (discovery) =>
                              discovery.id ===
                              selectedDiscovery.id
                                ? {
                                    ...discovery,
                                    categoryId,
                                  }
                                : discovery
                          )
                      )
                    })
                  }}
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              {discoveries.length > 1 && (
                <div className="discovery-merge-area">
                  <span className="discovery-category-field-heading">
                    Merge with...
                  </span>

                  <div className="discovery-merge-controls">
                    <select
                      className="record-select"
                      value={mergeTargetId}
                      onChange={(event) =>
                        setMergeTargetId(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select Discovery…
                      </option>

                      {discoveries
                        .filter(
                          (discovery) =>
                            discovery.id !==
                            selectedDiscovery.id
                        )
                        .map(
                          (discovery) => (
                            <option
                              key={discovery.id}
                              value={discovery.id}
                            >
                              {discovery.title}
                            </option>
                          )
                        )}
                    </select>

                    <button
                      type="button"
                      className="text-button"
                      disabled={!mergeTargetId}
                      onClick={() => {
                        if (!mergeTarget) {
                          return
                        }

                        void Promise.all([
                          getNoteContributions(
                            'discovery',
                            selectedDiscovery.id
                          ),

                          getNoteContributions(
                            'discovery',
                            mergeTarget.id
                          ),
                        ]).then(
                          ([
                            survivorContributions,
                            targetContributions,
                          ]) => {
                            const contributions =
                              [
                                ...survivorContributions,
                                ...targetContributions,
                              ].sort(
                                (a, b) => {
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
                                }
                              )

                            setMergePreviewNotes(
                              contributions
                                .map(
                                  (contribution) =>
                                    contribution.text
                                )
                                .filter(Boolean)
                                .join('\n')
                            )

                            setShowMergePreview(
                              true
                            )
                          }
                        )
                      }}
                    >
                      Merge
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showMergePreview &&
              mergeTarget && (
                <div
                  className="discovery-merge-modal-backdrop"
                  onClick={() =>
                    setShowMergePreview(
                      false
                    )
                  }
                >
                  <div
                    className="discovery-merge-modal"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <h2 className="modal-title">Merge Preview</h2>

                    <p>
                      <strong>
                        {
                          selectedDiscovery.title
                        }
                      </strong>{' '}
                      will remain.
                    </p>

                    <p>
                      <strong>
                        {
                          mergeTarget.title
                        }
                      </strong>{' '}
                      will be merged into it.
                    </p>

                    <div className="discovery-merge-modal-section">
                      <h3 className="subsection-title">Combined Notes</h3>

                      <div className="discovery-merge-notes-preview">
                        {mergePreviewNotes ||
                          'No notes to merge.'}
                      </div>
                    </div>

                    <div className="discovery-merge-preview-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setShowMergePreview(
                            false
                          )
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          void mergeDiscoveries(
                            selectedDiscovery.id,
                            mergeTarget.id
                          ).then(
                            async (
                              mergedDiscovery
                            ) => {
                              const refreshed =
                                await getDiscoveries(
                                  campaign.id
                                )

                              setDiscoveries(
                                refreshed
                              )

                              if (
                                mergedDiscovery
                              ) {
                                setTitleDraft(
                                  mergedDiscovery.title
                                )

                                setNotesDraft(
                                  mergedDiscovery.notes
                                )
                              }

                              const sessions =
                                await getSessionsForEntry(
                                  campaign.id,
                                  'discovery',
                                  selectedDiscovery.id
                                )

                              setRelatedSessions(
                                sessions
                              )

                              setMergeTargetId(
                                ''
                              )

                              setShowMergePreview(
                                false
                              )
                            }
                          )
                        }}
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                </div>
              )}

            <div className="page-section">
              <h2 className="section-title">Notes</h2>

              <textarea
                ref={notesEditorRef}
                className="writing-textarea discovery-notes discovery-notes-editor"
                value={notesDraft}
                onChange={(event) =>
                  setNotesDraft(
                    event.target.value
                  )
                }
                placeholder="No notes yet."
              />
            </div>

            <div className="page-section">
              <h2 className="section-title">First Discovered</h2>

              {firstDiscoveredSession ? (
                <button
                  type="button"
                  className="text-button entry-session-link"
                  onClick={() =>
                    onOpenSession(
                      firstDiscoveredSession.id
                    )
                  }
                >
                  Session{' '}
                  {
                    firstDiscoveredSession
                      .sessionNumber
                  }
                  {firstDiscoveredSession.title && (
                    <>
                      {' — '}
                      {firstDiscoveredSession.title}
                    </>
                  )}
                </button>
              ) : (
                <p className="empty-message">
                  No Session source
                  recorded.
                </p>
              )}
            </div>

            <div className="page-section">
              <h2 className="section-title">Sessions</h2>

              {visibleSessions.length >
              0 ? (
                <>
                  <div className="entry-session-list">
                    {visibleSessions.map(
                      (session) => (
                        <button
                          key={session.id}
                          type="button"
                          className="text-button entry-session-link"
                          onClick={() =>
                            onOpenSession(session.id)
                          }
                        >
                          Session{' '}
                          {session.sessionNumber}
                          {session.title && (
                            <>
                              {' — '}
                              {session.title}
                            </>
                          )}
                        </button>
                      )
                    )}
                  </div>

                  {relatedSessions.length >
                    3 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setShowAllSessions(
                          (current) =>
                            !current
                        )
                      }
                    >
                      {showAllSessions
                        ? 'Show less'
                        : 'Show all'}
                    </button>
                  )}
                </>
              ) : (
                <p className="empty-message">
                  No associated Sessions
                  recorded.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="page-section">
            <p className="empty-message">No Discovery selected</p>
          </div>
                )}
      </section>

      {discoveryPendingDeletion && (
        <ConfirmModal
          title="Delete Discovery?"
          message={`Delete "${discoveryPendingDeletion.title}"? This cannot be undone.`}
          confirmLabel="Delete Discovery"
          isConfirming={isDeletingDiscovery}
          onCancel={() =>
            setDiscoveryPendingDeletion(null)
          }
          onConfirm={() => {
            if (isDeletingDiscovery) {
              return
            }

            void (async () => {
              try {
                setIsDeletingDiscovery(true)

                await deleteDiscovery(
                  discoveryPendingDeletion.id
                )

                setDiscoveries(
                  (current) =>
                    current.filter(
                      (discovery) =>
                        discovery.id !==
                        discoveryPendingDeletion.id
                    )
                )

                if (
                  selectedDiscoveryId ===
                  discoveryPendingDeletion.id
                ) {
                  setSelectedDiscoveryId(
                    undefined
                  )
                }

                setDiscoveryPendingDeletion(
                  null
                )
              } catch (error) {
                console.error(
                  'Could not delete Discovery.',
                  error
                )
              } finally {
                setIsDeletingDiscovery(false)
              }
            })()
          }}
        />
      )}
    </>
  )
}