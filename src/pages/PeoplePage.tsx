import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  deletePerson,
  getNoteContributions,
  getPeople,
  getSessionsForEntry,
  mergePeople,
  updatePersonName,
  updatePersonRelationship,
  updatePersonNotes,
} from '../data/repository'

import type {
  Campaign,
  Person,
  PersonRelationship,
  Session,
} from '../data/database'

import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'
import GuideHelpButton from '../components/GuideHelpButton'

import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

export default function PeoplePage({
  campaign,
  onOpenSession,
}: {
  campaign: Campaign
  onOpenSession: (
    sessionId: string
  ) => void
}) {
  const [people, setPeople] =
    useState<Person[]>([])

  const [
    selectedPersonId,
    setSelectedPersonId,
  ] =
    useState<string | undefined>()

  const [
    relatedSessions,
    setRelatedSessions,
  ] = useState<Session[]>([])

  const [
    notesDraft,
    setNotesDraft,
  ] = useState('')

  const notesEditorRef =
    useRef<HTMLTextAreaElement | null>(null)

  useAutoGrowTextarea(
    notesEditorRef,
    notesDraft
  )

  const [
    relationshipDraft,
    setRelationshipDraft,
  ] =
    useState<PersonRelationship>(
      'unknown'
    )

  const [
    nameDraft,
    setNameDraft,
  ] = useState('')

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

  const [isLoading, setIsLoading] =
    useState(true)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  useEffect(() => {
    async function loadPeople() {
      const result =
        await getPeople(campaign.id)

      setPeople(result)

      if (result.length > 0) {
        setSelectedPersonId(
          result[0].id
        )
      }

      setIsLoading(false)
    }

    void loadPeople()
  }, [campaign.id])

  const selectedPerson =
    people.find(
      (person) =>
        person.id === selectedPersonId
    )

  const mergeTarget =
    people.find(
      (person) =>
        person.id === mergeTargetId
    )

  useEffect(() => {
    async function loadPersonInfo() {
      if (!selectedPerson) {
        setRelatedSessions([])
        setNotesDraft('')
        setRelationshipDraft('unknown')
        setNameDraft('')
        setMergeTargetId('')
        return
      }

      const [
        sessions,
        contributions,
      ] = await Promise.all([
        getSessionsForEntry(
          campaign.id,
          'person',
          selectedPerson.id
        ),

        getNoteContributions(
          'person',
          selectedPerson.id
        ),
      ])

      setRelatedSessions(sessions)

      const contributionText =
        contributions
          .map(
            (contribution) =>
              contribution.text
          )
          .filter(Boolean)
          .join('\n')

      setNotesDraft(
        selectedPerson.notes ||
          contributionText
      )

      setRelationshipDraft(
        selectedPerson.relationship
      )

      setNameDraft(
        selectedPerson.name
      )

      setShowAllSessions(false)
    }

    void loadPersonInfo()
  }, [
    campaign.id,
    selectedPersonId,
  ])

  const [saveStatus, setSaveStatus] =
  useState<SaveStatusState>('saved')

  useEffect(() => {
    if (!selectedPersonId) {
      return
    }

    const timeout =
      window.setTimeout(async () => {
        try {
          setSaveStatus('saving')

          await updatePersonNotes(
            selectedPersonId,
            notesDraft
          )

          setPeople((current) =>
            current.map((person) =>
              person.id === selectedPersonId
                ? {
                    ...person,
                    notes: notesDraft,
                  }
                : person
            )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Person notes.',
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
    selectedPersonId,
  ])

  useEffect(() => {
    if (!selectedPersonId) {
      return
    }

    const timeout =
      window.setTimeout(async () => {
        try {
          setSaveStatus('saving')

          await updatePersonRelationship(
            selectedPersonId,
            relationshipDraft
          )

          setPeople((current) =>
            current.map((person) =>
              person.id === selectedPersonId
                ? {
                    ...person,
                    relationship:
                      relationshipDraft,
                  }
                : person
            )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Person relationship.',
            error
          )
          setSaveStatus('error')
        }
      }, 400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    relationshipDraft,
    selectedPersonId,
  ])

  useEffect(() => {
    if (!selectedPersonId) {
      return
    }

    const trimmedName =
      nameDraft.trim()

    if (!trimmedName) {
      return
    }

    const timeout =
      window.setTimeout(async () => {
        try {
          setSaveStatus('saving')

          await updatePersonName(
            selectedPersonId,
            trimmedName
          )

          setPeople((current) =>
            current
              .map((person) =>
                person.id === selectedPersonId
                  ? {
                      ...person,
                      name:
                        trimmedName,
                    }
                  : person
              )
              .sort((a, b) =>
                a.name.localeCompare(
                  b.name
                )
              )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Person name.',
            error
          )
          setSaveStatus('error')
        }
      }, 400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    nameDraft,
    selectedPersonId,
  ])

  const normalizedSearch =
    searchQuery.trim().toLowerCase()

  const filteredPeople =
    normalizedSearch
      ? people.filter((person) => {
          const searchableText = [
            person.name,
            person.relationship ?? '',
            person.notes ?? '',
          ]
            .join(' ')
            .toLowerCase()

          return searchableText.includes(
            normalizedSearch
          )
        })
      : people

  const visibleSessions =
    showAllSessions
      ? relatedSessions
      : relatedSessions.slice(0, 3)

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1 className="page-title">People</h1>

          <p className="subtitle">
            Loading People…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  return (
    <>
      <section className="page left-page distress-d people-page">
        <div className="page-heading-with-status">
          <div className="page-heading-copy">
            <h1 className="page-title">
              People
            </h1>

            <p className="page-intro">
              Friends, foes, and those
              yet to reveal which.
            </p>
          </div>

          <div className="page-heading-actions">
            <SaveStatus
              status={saveStatus}
              className="person-save-status"
            />

            <GuideHelpButton topicId="people" />
          </div>
        </div>

        <input
          className="people-search"
          type="search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          placeholder="Search People…"
        />

        {filteredPeople.length === 0 ? (
          <p className="empty-message">
            {people.length === 0
              ? 'No People have been added yet.'
              : 'No matching People found.'}
          </p>
        ) : (
          <div className="people-list">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                className={
                  person.id === selectedPersonId
                    ? 'people-list-item active'
                    : 'people-list-item'
                }
                onClick={() =>
                  setSelectedPersonId(
                    person.id
                  )
                }
              >
                {person.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="page right-page distress-a people-page people-detail-page">
        {selectedPerson ? (
          <>
            <div className="person-heading-row">
              <input
                className="person-name-editor"
                value={nameDraft}
                onChange={(event) =>
                  setNameDraft(
                    event.target.value
                  )
                }
              />
              <button
                type="button"
                className="destructive-button person-delete-button"
              onClick={() => {
                const confirmed =
                  window.confirm(
                    `Delete ${selectedPerson.name}?`
                  )

                if (!confirmed) {
                  return
                }

                void deletePerson(
                  selectedPerson.id
                ).then(() => {
                  setPeople((current) =>
                    current.filter(
                      (person) =>
                        person.id !==
                        selectedPerson.id
                    )
                  )

                  setSelectedPersonId(
                    undefined
                  )
                })
              }}
            >
              Delete Person
            </button>
            </div>
            <div className="discovery-top-meta-row">
              <label className="discovery-category-field">
                <span className="section-title discovery-category-field-heading">
                  Relationship
                </span>

                <select
                  value={relationshipDraft}
                  onChange={(event) =>
                    setRelationshipDraft(
                      event.target
                        .value as PersonRelationship
                    )
                  }
                >
                  <option value="unknown">
                    Unknown
                  </option>
                  <option value="stranger">
                    Stranger
                  </option>
                  <option value="ally">
                    Ally
                  </option>
                  <option value="neutral">
                    Neutral
                  </option>
                  <option value="rival">
                    Rival
                  </option>
                  <option value="foe">
                    Foe
                  </option>
                </select>
              </label>

              {people.length > 1 && (
                <div className="discovery-merge-area">
                  <span className="discovery-category-field-heading">
                    Merge with...
                  </span>

                  <div className="discovery-merge-controls">
                    <select
                      value={mergeTargetId}
                      onChange={(event) =>
                        setMergeTargetId(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select Person...
                      </option>

                      {people
                        .filter(
                          (person) =>
                            person.id !==
                            selectedPerson.id
                        )
                        .map((person) => (
                          <option
                            key={person.id}
                            value={person.id}
                          >
                            {person.name}
                          </option>
                        ))}
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
                            'person',
                            selectedPerson.id
                          ),
                          getNoteContributions(
                            'person',
                            mergeTarget.id
                          ),
                        ]).then(
                          ([
                            survivorContributions,
                            targetContributions,
                          ]) => {
                            const contributions = [
                              ...survivorContributions,
                              ...targetContributions,
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

                            setMergePreviewNotes(
                              contributions
                                .map(
                                  (contribution) =>
                                    contribution.text
                                )
                                .filter(Boolean)
                                .join('\n')
                            )

                            setShowMergePreview(true)
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
                  className="person-merge-modal-backdrop"
                  onClick={() =>
                    setShowMergePreview(false)
                  }
                >
                  <div
                    className="person-merge-modal"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <h2 className="modal-title">Merge Preview</h2>

                    <p>
                      <strong>
                        {selectedPerson.name}
                      </strong>{' '}
                      will remain.
                    </p>

                    <p>
                      <strong>
                        {mergeTarget.name}
                      </strong>{' '}
                      will be merged into it.
                    </p>

                    <div className="person-merge-modal-section">
                      <h3 className="subsection-title">Combined Notes</h3>

                      <div className="person-merge-notes-preview">
                        {mergePreviewNotes ||
                          'No notes to merge.'}
                      </div>
                    </div>

                    <div className="person-merge-preview-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setShowMergePreview(false)
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          void mergePeople(
                            selectedPerson.id,
                            mergeTarget.id
                          ).then(async (mergedPerson) => {
                            const refreshed =
                              await getPeople(
                                campaign.id
                              )

                            setPeople(refreshed)

                            if (mergedPerson) {
                              setNotesDraft(
                                mergedPerson.notes
                              )
                            }

                            const sessions =
                              await getSessionsForEntry(
                                campaign.id,
                                'person',
                                selectedPerson.id
                              )

                            setRelatedSessions(sessions)
                            setMergeTargetId('')
                            setShowMergePreview(false)
                          })
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
                className="writing-textarea person-notes person-notes-editor"
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
              <h2 className="section-title">Sessions</h2>

              {visibleSessions.length > 0 ? (
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
            <p className="empty-message">No Person selected</p>
          </div>
        )}
      </section>
    </>
  )
}