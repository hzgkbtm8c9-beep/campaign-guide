import {
  useEffect,
  useState,
} from 'react'

import {
  getDiscoveries,
  getDiscoveryCategories,
  getSession,
  getSessionsForEntry,
} from '../data/repository'

import type {
  Campaign,
  Discovery,
  DiscoveryCategory,
  Session,
} from '../data/database'

export default function DiscoveriesPage({
  campaign,
}: {
  campaign: Campaign
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
    relatedSessions,
    setRelatedSessions,
  ] = useState<Session[]>([])

  const [
    firstDiscoveredSession,
    setFirstDiscoveredSession,
  ] = useState<Session | undefined>()

  const [
    showAllSessions,
    setShowAllSessions,
  ] = useState(false)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

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

  const selectedDiscovery =
    discoveries.find(
      (discovery) =>
        discovery.id ===
        selectedDiscoveryId
    )

  useEffect(() => {
    async function loadSessionInfo() {
      if (!selectedDiscovery) {
        setRelatedSessions([])
        setFirstDiscoveredSession(
          undefined
        )
        return
      }

      const contributionSessions =
        await getSessionsForEntry(
          campaign.id,
          'discovery',
          selectedDiscovery.id
        )

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
    selectedDiscovery,
  ])

  function getCategoryName(
    categoryId: string
  ) {
    return (
      categories.find(
        (category) =>
          category.id === categoryId
      )?.name ??
      'Unknown Category'
    )
  }

  const visibleSessions =
    showAllSessions
      ? relatedSessions
      : relatedSessions.slice(0, 3)

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>Discoveries</h1>

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
      <section className="page left-page distress-e">
        <h1>Discoveries</h1>

        <p className="subtitle">
          Discoveries from{' '}
          {campaign.name}
        </p>

        {discoveries.length === 0 ? (
          <p className="empty-message">
            No Discoveries have been
            added yet.
          </p>
        ) : (
          <div className="discovery-list">
            {discoveries.map(
              (discovery) => (
                <button
                  key={discovery.id}
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
                    {discovery.title}
                  </strong>

                  <span>
                    {getCategoryName(
                      discovery.categoryId
                    )}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className="page right-page distress-b">
        {selectedDiscovery ? (
          <>
            <h1>
              {selectedDiscovery.title}
            </h1>

            <p className="subtitle">
              {getCategoryName(
                selectedDiscovery.categoryId
              )}
            </p>

            <div className="page-section">
              <h2>Notes</h2>

              {selectedDiscovery.notes ? (
                <p className="discovery-notes">
                  {
                    selectedDiscovery.notes
                  }
                </p>
              ) : (
                <p className="empty-message">
                  No notes yet.
                </p>
              )}
            </div>

            <div className="page-section">
              <h2>
                First Discovered
              </h2>

              {firstDiscoveredSession ? (
                <p>
                  Session{' '}
                  {
                    firstDiscoveredSession
                      .sessionNumber
                  }
                </p>
              ) : (
                <p className="empty-message">
                  No Session source
                  recorded.
                </p>
              )}
            </div>

            <div className="page-section">
              <h2>Sessions</h2>

              {visibleSessions.length >
              0 ? (
                <>
                  <div className="entry-session-list">
                    {visibleSessions.map(
                      (session) => (
                        <div
                          key={session.id}
                          className="entry-session-item"
                        >
                          Session{' '}
                          {
                            session.sessionNumber
                          }
                        </div>
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
            <h2>
              No Discovery selected
            </h2>
          </div>
        )}
      </section>
    </>
  )
}