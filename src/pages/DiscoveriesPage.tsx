import { useEffect, useState } from 'react'

import {
  getDiscoveries,
  getDiscoveryCategories,
} from '../data/repository'

import type {
  Campaign,
  Discovery,
  DiscoveryCategory,
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
      <section className="page left-page">
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

      <section className="page right-page">
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
                Discovery Source
              </h2>

              {selectedDiscovery
                .discoveredInSessionId ? (
                <p>
                  Added during a
                  completed Session
                  Review.
                </p>
              ) : (
                <p className="empty-message">
                  No Session source
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