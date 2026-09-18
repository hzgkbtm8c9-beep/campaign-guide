import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  Campaign,
  Session,
} from '../data/database'

import {
  getCompletedSessions,
  updateSessionJournalText,
  updateSessionTitle,
} from '../data/repository'

import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

import GuideHelpButton from '../components/GuideHelpButton'

export default function JournalPage({
  campaign,
  initialSessionId,
}: {
  campaign: Campaign
  initialSessionId?: string
}) {
  const [
    sessions,
    setSessions,
  ] = useState<Session[]>([])

  const [
    selectedSessionId,
    setSelectedSessionId,
  ] = useState<string | undefined>()

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    journalDraft,
    setJournalDraft,
  ] = useState('')

  const [
    titleDraft,
    setTitleDraft,
  ] = useState('')

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const journalEditorRef =
    useRef<HTMLTextAreaElement | null>(
      null
    )

  const [saveStatus, setSaveStatus] =
    useState<SaveStatusState>('saved')

  useEffect(() => {
    async function loadJournal() {
      const result =
        await getCompletedSessions(
          campaign.id
        )

      setSessions(result)

      if (result.length > 0) {
        const requestedSession =
          initialSessionId
            ? result.find(
                (session) =>
                  session.id ===
                  initialSessionId
              )
            : undefined

        setSelectedSessionId(
          requestedSession?.id ??
            result[0].id
        )
      }

      setIsLoading(false)
    }

    void loadJournal()
  }, [
    campaign.id,
    initialSessionId,
  ])

  const selectedSession =
    sessions.find(
      (session) =>
        session.id ===
        selectedSessionId
    )

  useEffect(() => {
    setJournalDraft(
      selectedSession?.journalText ?? ''
    )

    setTitleDraft(
      selectedSession?.title ?? ''
    )
  }, [selectedSessionId])

  useEffect(() => {
    const editor =
      journalEditorRef.current

    if (!editor) {
      return
    }

    editor.style.height = 'auto'
    editor.style.height =
      `${editor.scrollHeight}px`
  }, [journalDraft])

  useEffect(() => {
    if (!selectedSessionId) {
      return
    }

    const timeout = window.setTimeout(
      async () => {
        try {
          setSaveStatus('saving')

          await updateSessionJournalText(
            selectedSessionId,
            journalDraft
          )

          setSessions((current) =>
            current.map((session) =>
              session.id === selectedSessionId
                ? {
                    ...session,
                    journalText:
                      journalDraft,
                  }
                : session
            )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Journal text.',
            error
          )
          setSaveStatus('error')
        }
      },
      400
    )

    return () => {
      window.clearTimeout(timeout)
    }
  }, [journalDraft, selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) {
      return
    }

    const timeout = window.setTimeout(
      async () => {
        try {
          setSaveStatus('saving')

          await updateSessionTitle(
            selectedSessionId,
            titleDraft
          )

          setSessions((current) =>
            current.map((session) =>
              session.id === selectedSessionId
                ? {
                    ...session,
                    title: titleDraft,
                  }
                : session
            )
          )

          setSaveStatus('saved')
        } catch (error) {
          console.error(
            'Could not save Journal title.',
            error
          )
          setSaveStatus('error')
        }
      },
      400
    )

    return () => {
      window.clearTimeout(timeout)
    }
  }, [titleDraft, selectedSessionId])

const normalizedSearch =
  searchQuery.trim().toLowerCase()

const filteredSessions =
  normalizedSearch
    ? sessions.filter((session) => {
        const title =
          session.title.toLowerCase()

        const journalText =
          session.journalText.toLowerCase()

        return (
          title.includes(
            normalizedSearch
          ) ||
          journalText.includes(
            normalizedSearch
          )
        )
      })
    : sessions

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1 className="page-title">Journal</h1>

          <p className="subtitle">
            Loading Journal…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  return (
    <>
      <section className="page left-page distress-f journal-page">
        <div className="page-heading-with-status">
          <div className="page-heading-copy">
            <h1 className="page-title">
              Journal
            </h1>

            <p className="page-intro">
              The tale of your adventures,
              as best anyone remembers them.
            </p>
          </div>

                    <div className="page-heading-actions">
            <SaveStatus
              status={saveStatus}
            />

            <GuideHelpButton topicId="journal" />
          </div>
        </div>

        <input
          type="search"
          className="discoveries-search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          placeholder="Search Journal…"
          aria-label="Search Journal"
        />

        {sessions.length === 0 ? (
          <p className="empty-message">
            No completed Sessions yet.
          </p>
        ) : filteredSessions.length === 0 ? (
          <p className="empty-message">
            No Journal matches found.
          </p>
        ) : (
          <div className="journal-list">
            {filteredSessions.map(
              (session) => (
                <button
                  key={session.id}
                  className={
                    session.id ===
                    selectedSessionId
                      ? 'journal-list-item active'
                      : 'journal-list-item'
                  }
                  onClick={() =>
                    setSelectedSessionId(
                      session.id
                    )
                  }
                >
                  <strong>
                    Session{' '}
                    {session.sessionNumber}
                  </strong>

                  <span>
                    {session.title ||
                      'Untitled Session'}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className="page right-page distress-c journal-page journal-detail-page">
        {selectedSession ? (
          <>
            <h1 className="detail-title">
              Session{' '}
              {selectedSession.sessionNumber}
            </h1>

            <input
              type="text"
              className="journal-title-editor"
              value={titleDraft}
              onChange={(event) =>
                setTitleDraft(
                  event.target.value
                )
              }
              placeholder="Untitled Session"
              aria-label="Session title"
            />

            <div className="page-section">
              <h2 className="section-title">Journal Entry</h2>

              <textarea
                ref={journalEditorRef}
                className="journal-entry-text journal-entry-editor"
                value={journalDraft}
                onChange={(event) =>
                  setJournalDraft(
                    event.target.value
                  )
                }
                placeholder="No Journal text was committed for this Session."
              />
            </div>
          </>
        ) : (
          <div className="page-section">
            <p className="empty-message">No Session selected</p>
          </div>
        )}
      </section>
    </>
  )
}