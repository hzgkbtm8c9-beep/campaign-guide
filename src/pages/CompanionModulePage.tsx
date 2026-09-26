import {
  useEffect,
  useState,
} from 'react'

import type {
  Campaign,
  CharacterModule,
  CompanionModuleData,
  CompanionAbility,
} from '../data/database'

import {
  createCompanionModule,
  addCompanionAbility,
  getCompanionAbilities,
  getCompanionModule,
  getCompanionModuleData,
  getOrCreateCharacter,
  updateCompanionAbility,
  deleteCompanionAbility,
  updateCompanionModuleData,
} from '../data/repository'

import { WritingTextarea } from '../components/WritingTextarea'
import GuideHelpButton from '../components/GuideHelpButton'
import CharacterModuleActions from '../components/CharacterModuleActions'
import ConfirmModal from '../components/ConfirmModal'

import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

function CompanionModulePage({
  campaign,
  module,
  onDeleteModule,
}: {
  campaign: Campaign
  module: CharacterModule
  onDeleteModule: (
    module: CharacterModule
  ) => void
}) {
  const [
    characterModule,
    setCharacterModule,
  ] = useState<CharacterModule | null>(null)

  const [
    companionData,
    setCompanionData,
  ] = useState<CompanionModuleData | null>(null)

  const [
    companionAbilities,
    setCompanionAbilities,
  ] = useState<CompanionAbility[]>([])

  const [
    abilityPendingDeletion,
    setAbilityPendingDeletion,
  ] = useState<CompanionAbility | null>(null)

  const [
    isDeletingAbility,
    setIsDeletingAbility,
  ] = useState(false)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [saveStatus, setSaveStatus] =
    useState<SaveStatusState>('saved')

  useEffect(() => {
    let isCancelled = false

    async function loadModule() {
      setIsLoading(true)

      const character =
        await getOrCreateCharacter(
          campaign.id
        )

      const module =
        await getCompanionModule(
          character.id
        )

      const moduleData =
        module
          ? await getCompanionModuleData(
              module.id
            )
          : null

      const abilities =
        module
          ? await getCompanionAbilities(
              module.id
            )
          : []

      if (!isCancelled) {
        setCharacterModule(
          module ?? null
        )

        setCompanionAbilities(abilities)

        setCompanionData(
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
      await createCompanionModule(
        campaign.id,
        character.id
      )

    setCharacterModule(module)

    const moduleData =
      await getCompanionModuleData(
        module.id
      )

    setCompanionData(
      moduleData ?? null
    )
  }

  async function handleNameChange(
    value: string
    ) {
    if (!characterModule) {
        return
    }

    try {
        setSaveStatus('saving')

        const updatedData =
        await updateCompanionModuleData(
            characterModule.id,
            {
            name: value,
            }
        )

        setCompanionData(
        updatedData ?? null
        )

        setSaveStatus('saved')
    } catch (error) {
        console.error(
        'Could not save companion name.',
        error
        )
        setSaveStatus('error')
    }
    }

  async function handleAddAbility() {
    if (!characterModule) {
      return
    }

    const ability =
      await addCompanionAbility(
        characterModule.id
      )

    setCompanionAbilities(
      (current) => [
        ...current,
        ability,
      ]
    )
  }

  return (
    <>
      <section className="page left-page distress-b">
        <div className="page-heading-with-status">
            <div className="page-heading-copy">
            <h1 className="page-title">
                Companion
            </h1>

            <p className="page-intro">
              A trusted companion with instincts,
              quirks, and a will of its own
            </p>
            </div>

            <div className="page-heading-actions">
              <SaveStatus
                status={saveStatus}
              />

              <GuideHelpButton topicId="companion" />
            </div>
            </div>

        {isLoading ? (
          <p className="empty-message">
            Loading companion...
          </p>
        ) : characterModule && companionData ? (
          <div>
            <label className="character-name-field companion-name-field">
              <span>Companion Name</span>

              <input
                type="text"
                value={companionData.name}
                placeholder="Companion name"
                onChange={(event) =>
                  handleNameChange(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="companion-description-field">
              <span className="section-title companion-description-title">Description</span>

              <WritingTextarea
                className="companion-description-editor"
                value={companionData.description}
                onChange={async (event) => {
                    if (!characterModule) {
                        return
                    }

                    try {
                        setSaveStatus('saving')

                        const updatedData =
                        await updateCompanionModuleData(
                            characterModule.id,
                            {
                            description:
                                event.target.value,
                            }
                        )

                        setCompanionData(
                        updatedData ?? null
                        )

                        setSaveStatus('saved')
                    } catch (error) {
                        console.error(
                        'Could not save companion description.',
                        error
                        )
                        setSaveStatus('error')
                    }
                    }}
              />
            </label>

            <div className="companion-state-field">
              <span className="section-title companion-state-label">
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
                      companionData.relationship === value
                        ? 'companion-state-button active'
                        : 'companion-state-button'
                    }
                    onClick={async () => {
                        if (!characterModule) {
                            return
                        }

                        try {
                            setSaveStatus('saving')

                            const updatedData =
                            await updateCompanionModuleData(
                                characterModule.id,
                                {
                                relationship: value,
                                }
                            )

                            setCompanionData(
                            updatedData ?? null
                            )

                            setSaveStatus('saved')
                        } catch (error) {
                            console.error(
                            'Could not save companion relationship.',
                            error
                            )
                            setSaveStatus('error')
                        }
                        }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="companion-state-field">
              <span className="section-title companion-state-label">
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
                      companionData.hunger === value
                        ? 'companion-state-button active'
                        : 'companion-state-button'
                    }
                    onClick={async () => {
                        if (!characterModule) {
                            return
                        }

                        try {
                            setSaveStatus('saving')

                            const updatedData =
                            await updateCompanionModuleData(
                                characterModule.id,
                                {
                                hunger: value,
                                }
                            )

                            setCompanionData(
                            updatedData ?? null
                            )

                            setSaveStatus('saved')
                        } catch (error) {
                            console.error(
                            'Could not save companion hunger.',
                            error
                            )
                            setSaveStatus('error')
                        }
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
              className="primary-button"
              onClick={handleCreateModule}
            >
              Add Companion
            </button>
          </div>
        )}
      </section>

      <section className="page right-page distress-d">
        <div className="companion-abilities">
            <div className="companion-abilities-heading">
                <h1 className="detail-title">Abilities</h1>

                <button
                type="button"
                className="primary-button compact-button companion-ability-add"
                onClick={handleAddAbility}
                >
                + Add Ability
                </button>
            </div>

          {companionAbilities.length === 0 ? (
            <p className="empty-message">
              No abilities added yet.
            </p>
          ) : (
            companionAbilities.map(
              (ability) => (
                <div
                  key={ability.id}
                  className="companion-ability"
                >
                  <div className="companion-ability-heading">
                    <input
                        className="section-title companion-ability-name"
                        type="text"
                        value={ability.name}
                        placeholder="Ability name"
                        onChange={async (event) => {
                            try {
                                setSaveStatus('saving')

                                const updatedAbility =
                                await updateCompanionAbility(
                                    ability.id,
                                    {
                                    name: event.target.value,
                                    }
                                )

                                if (!updatedAbility) {
                                setSaveStatus('error')
                                return
                                }

                                setCompanionAbilities(
                                (current) =>
                                    current.map((item) =>
                                    item.id === updatedAbility.id
                                        ? updatedAbility
                                        : item
                                    )
                                )

                                setSaveStatus('saved')
                            } catch (error) {
                                console.error(
                                'Could not save companion ability name.',
                                error
                                )
                                setSaveStatus('error')
                            }
                            }}
                    />

                    <button
                      type="button"
                      className="destructive-button companion-ability-delete"
                      onClick={() =>
                        setAbilityPendingDeletion(ability)
                      }
                    >
                      Delete Ability
                    </button>
                    </div>

                    <label className="subsection-title companion-ability-description-label">
                    Description
                    </label>

                    <WritingTextarea
                    className="companion-ability-description"
                    value={ability.description}
                    placeholder="Ability description"
                    onChange={async (event) => {
                        try {
                            setSaveStatus('saving')

                            const updatedAbility =
                            await updateCompanionAbility(
                                ability.id,
                                {
                                description:
                                    event.target.value,
                                }
                            )

                            if (!updatedAbility) {
                            setSaveStatus('error')
                            return
                            }

                            setCompanionAbilities(
                            (current) =>
                                current.map((item) =>
                                item.id === updatedAbility.id
                                    ? updatedAbility
                                    : item
                                )
                            )

                            setSaveStatus('saved')
                        } catch (error) {
                            console.error(
                            'Could not save companion ability description.',
                            error
                            )
                            setSaveStatus('error')
                        }
                        }}
                    />
                </div>
              )
            )
          )}
                </div>

                <CharacterModuleActions
          module={module}
          onDelete={onDeleteModule}
        />
      </section>

      {abilityPendingDeletion && (
        <ConfirmModal
          title="Delete Ability?"
          message={
            abilityPendingDeletion.name.trim()
              ? `Delete "${abilityPendingDeletion.name}"? This cannot be undone.`
              : 'Delete this ability? This cannot be undone.'
          }
          confirmLabel="Delete Ability"
          isConfirming={isDeletingAbility}
          onCancel={() =>
            setAbilityPendingDeletion(null)
          }
          onConfirm={() => {
            if (isDeletingAbility) {
              return
            }

            void (async () => {
              try {
                setIsDeletingAbility(true)

                await deleteCompanionAbility(
                  abilityPendingDeletion.id
                )

                setCompanionAbilities(
                  (current) =>
                    current.filter(
                      (item) =>
                        item.id !==
                        abilityPendingDeletion.id
                    )
                )

                setAbilityPendingDeletion(null)
              } catch (error) {
                console.error(
                  'Could not delete companion ability.',
                  error
                )
              } finally {
                setIsDeletingAbility(false)
              }
            })()
          }}
        />
      )}
    </>
  )
}

export default CompanionModulePage