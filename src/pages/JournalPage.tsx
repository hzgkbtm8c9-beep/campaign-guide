import { useEffect, useState } from 'react'

import type {
  Campaign,
  Session,
} from '../data/database'

import {
  getCompletedSessions,
} from '../data/repository'

export default function JournalPage({
  campaign,
}: {
  campaign: Campaign
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

  useEffect(() => {
    async function loadJournal() {
      const result =
        await getCompletedSessions(
          campaign.id
        )

      setSessions(result)

      if (result.length > 0) {
        setSelectedSessionId(
          result[0].id
        )
      }

      setIsLoading(false)
    }

    void loadJournal()
  }, [campaign.id])

  const selectedSession =
    sessions.find(
      (session) =>
        session.id ===
        selectedSessionId
    )

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>Journal</h1>

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
      <section className="page left-page">
        <h1>Journal</h1>

        <p className="subtitle">
          Completed Sessions from{' '}
          {campaign.name}
        </p>

        {sessions.length === 0 ? (
          <p className="empty-message">
            No completed Sessions yet.
          </p>
        ) : (
          <div className="journal-list">
            {sessions.map(
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

      <section className="page right-page">
        {selectedSession ? (
          <>
            <h1>
              Session{' '}
              {
                selectedSession.sessionNumber
              }
            </h1>

            <p className="subtitle">
              {selectedSession.title ||
                'Untitled Session'}
            </p>

            <div className="page-section">
              <h2>Journal Entry</h2>

              {selectedSession.journalText ? (
                <p className="journal-entry-text">
                  {
                    selectedSession.journalText
                  }
                </p>
              ) : (
                <p className="empty-message">
                  No Journal text was
                  committed for this Session.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="page-section">
            <h2>
              No Session selected
            </h2>
          </div>
        )}
      </section>
    </>
  )
}