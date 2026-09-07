import {
  useEffect,
  useState,
} from 'react'

import type {
  Campaign,
  CharacterModule,
  FerretModuleData,
  FerretAbility,
} from '../data/database'

import {
  createFerretModule,
  addFerretAbility,
  getFerretAbilities,
  getFerretModule,
  getFerretModuleData,
  getOrCreateCharacter,
  updateFerretAbility,
  deleteFerretAbility,
  updateFerretModuleData,
} from '../data/repository'

function CharacterModulePage({
  campaign,
}: {
  campaign: Campaign
}) {
const [
  characterModule,
  setCharacterModule,
] = useState<CharacterModule | null>(null)

const [
  ferretData,
  setFerretData,
] = useState<FerretModuleData | null>(null)

const [
  ferretAbilities,
  setFerretAbilities,
] = useState<FerretAbility[]>([])

const [
  isLoading,
  setIsLoading,
] = useState(true)

useEffect(() => {
  let isCancelled = false

  async function loadModule() {
    setIsLoading(true)

    const character =
      await getOrCreateCharacter(
        campaign.id
      )

    const module =
        await getFerretModule(
            character.id
        )

    const moduleData =
    module
        ? await getFerretModuleData(
            module.id
        )
        : null

    const abilities =
    module
        ? await getFerretAbilities(
            module.id
        )
        : []

    if (!isCancelled) {
    setCharacterModule(
        module ?? null
    )
    setFerretAbilities(abilities)

    setFerretData(
        moduleData ?? null
    )

    setIsLoading(false)
    }
  }

  void loadModule()

  return () => {
    isCancelled = true
  }
}, [campaign.id])

async function handleCreateModule() {
  const character =
    await getOrCreateCharacter(
      campaign.id
    )

  const module =
    await createFerretModule(
      campaign.id,
      character.id
    )

  setCharacterModule(module)

  const moduleData =
  await getFerretModuleData(
    module.id
  )

    setFerretData(
    moduleData ?? null
    )
}

async function handleNameChange(
  value: string
) {
  if (!characterModule) {
    return
  }

  const updatedData =
    await updateFerretModuleData(
      characterModule.id,
      {
        name: value,
      }
    )

  setFerretData(
    updatedData ?? null
  )
}

async function handleAddAbility() {
  if (!characterModule) {
    return
  }

  const ability =
    await addFerretAbility(
      characterModule.id
    )

  setFerretAbilities(
    (current) => [
      ...current,
      ability,
    ]
  )
}

  return (
    <>
      <section className="page left-page distress-b">
        <h1>Ferret</h1>

        <p className="subtitle">
          Small Animal Companion
        </p>

        {isLoading ? (
            <p className="empty-message">
                Loading companion...
            </p>
            ) : characterModule && ferretData ? (
            <div>
                <label className="character-name-field companion-name-field">
                <span>Companion Name</span>

                <input
                    type="text"
                    value={ferretData.name}
                    placeholder="Companion name"
                    onChange={(event) =>
                    handleNameChange(
                        event.target.value
                    )
                    }
                />
                </label>

                    <label className="character-field companion-description-field">
                    <span>Description</span>

                    <textarea
                        value={ferretData.description}
                        onChange={async (event) => {
                        if (!characterModule) {
                            return
                        }

                        const updatedData =
                            await updateFerretModuleData(
                            characterModule.id,
                            {
                                description:
                                event.target.value,
                            }
                            )

                        setFerretData(
                            updatedData ?? null
                        )
                        }}
                    />
                    </label>

                <div className="companion-state-field">
                <span className="companion-state-label">
                    Relationship
                </span>

                <div className="companion-state-options">
                    {(
                    [
                        ['wary', 'Wary'],
                        ['tolerant', 'Tolerant'],
                        ['friendly', 'Friendly'],
                        ['trusting', 'Trusting'],
                        ['bonded', 'Bonded'],
                    ] as const
                    ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        className={
                        ferretData.relationship === value
                            ? 'companion-state-button active'
                            : 'companion-state-button'
                        }
                        onClick={async () => {
                        if (!characterModule) {
                            return
                        }

                        const updatedData =
                            await updateFerretModuleData(
                            characterModule.id,
                            {
                                relationship: value,
                            }
                            )

                        setFerretData(
                            updatedData ?? null
                        )
                        }}
                    >
                        {label}
                    </button>
                    ))}
                </div>
                </div>

                                <div className="companion-state-field">
                  <span className="companion-state-label">
                    Hunger
                  </span>

                  <div className="companion-state-options">
                    {(
                      [
                        ['full', 'Full'],
                        ['hungry', 'Hungry'],
                        ['starving', 'Starving'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          ferretData.hunger === value
                            ? 'companion-state-button active'
                            : 'companion-state-button'
                        }
                        onClick={async () => {
                          if (!characterModule) {
                            return
                          }

                          const updatedData =
                            await updateFerretModuleData(
                              characterModule.id,
                              {
                                hunger: value,
                              }
                            )

                          setFerretData(
                            updatedData ?? null
                          )
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="empty-message">
                  No companion has been added yet.
                </p>

                <button
                  type="button"
                  onClick={handleCreateModule}
                >
                  Add Companion
                </button>
              </div>
            )}
      </section>

      <section className="page right-page distress-d">
        <div className="companion-abilities">
          <h2>Abilities</h2>

          <button
            type="button"
            className="destination-add"
            onClick={handleAddAbility}
            >
            + Add Ability
            </button>

          {ferretAbilities.length === 0 ? (
            <p className="empty-message">
              No abilities added yet.
            </p>
          ) : (
            ferretAbilities.map(
              (ability) => (
                <div
                  key={ability.id}
                  className="companion-ability"
                >
                  <input
                    type="text"
                    value={ability.name}
                    placeholder="Ability name"
                    onChange={async (event) => {
                      const updatedAbility =
                        await updateFerretAbility(
                          ability.id,
                          {
                            name:
                              event.target.value,
                          }
                        )

                      if (!updatedAbility) {
                        return
                      }

                      setFerretAbilities(
                        (current) =>
                          current.map((item) =>
                            item.id === updatedAbility.id
                              ? updatedAbility
                              : item
                          )
                      )
                    }}
                  />

                  <textarea
                    value={ability.description}
                    placeholder="Ability description"
                    onChange={async (event) => {
                      const updatedAbility =
                        await updateFerretAbility(
                          ability.id,
                          {
                            description:
                              event.target.value,
                          }
                        )

                      if (!updatedAbility) {
                        return
                      }

                      setFerretAbilities(
                        (current) =>
                          current.map((item) =>
                            item.id === updatedAbility.id
                              ? updatedAbility
                              : item
                          )
                      )
                    }}
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed =
                        window.confirm(
                          'Delete this ability?'
                        )

                      if (!confirmed) {
                        return
                      }

                      await deleteFerretAbility(
                        ability.id
                      )

                      setFerretAbilities(
                        (current) =>
                          current.filter(
                            (item) =>
                              item.id !== ability.id
                          )
                      )
                    }}
                  >
                    Delete Ability
                  </button>
                </div>
              )
            )
          )}
        </div>
      </section>
    </>
  )
}

export default CharacterModulePage