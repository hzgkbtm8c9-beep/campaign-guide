import { useEffect, useState } from 'react'

import { getPeople } from '../data/repository'

import type {
  Campaign,
  Person,
} from '../data/database'

export default function PeoplePage({
  campaign,
}: {
  campaign: Campaign
}) {
  const [people, setPeople] =
    useState<Person[]>([])

  const [selectedPersonId, setSelectedPersonId] =
    useState<string | undefined>()

  const [isLoading, setIsLoading] =
    useState(true)

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

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>People</h1>

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
      <section className="page left-page">
        <h1>People</h1>

        <p className="subtitle">
          People known in {campaign.name}
        </p>

        {people.length === 0 ? (
          <p className="empty-message">
            No People have been added yet.
          </p>
        ) : (
          <div className="people-list">
            {people.map((person) => (
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

      <section className="page right-page">
        {selectedPerson ? (
          <>
            <h1>{selectedPerson.name}</h1>

            <div className="page-section">
              <h2>Description</h2>

              <p>
                {selectedPerson.description ||
                  'No description yet.'}
              </p>
            </div>

            <div className="page-section">
              <h2>Notes</h2>

              {selectedPerson.notes ? (
                <p className="person-notes">
                  {selectedPerson.notes}
                </p>
              ) : (
                <p className="empty-message">
                  No notes yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="page-section">
            <h2>No Person selected</h2>
          </div>
        )}
      </section>
    </>
  )
}