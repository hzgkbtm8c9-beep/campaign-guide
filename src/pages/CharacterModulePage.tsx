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

import { WritingTextarea } from '../components/WritingTextarea'
import GuideHelpButton from '../components/GuideHelpButton'

import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

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

    try {
        setSaveStatus('saving')

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
        <div className="page-heading-with-status">
            <div className="page-heading-copy">
            <h1 className="page-title">
                Ferret
            </h1>

            <p className="page-intro">
                Small paws, sharp instincts,
                questionable priorities.
            </p>
            </div>

                        <div className="page-heading-actions">
              <SaveStatus
                status={saveStatus}
              />

              <GuideHelpButton topicId="ferret" />
            </div>
            </div>

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

            <label className="companion-description-field">
              <span className="section-title companion-description-title">Description</span>

              <WritingTextarea
                className="companion-description-editor"
                value={ferretData.description}
                onChange={async (event) => {
                    if (!characterModule) {
                        return
                    }

                    try {
                        setSaveStatus('saving')

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
                      ferretData.relationship === value
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
                            await updateFerretModuleData(
                                characterModule.id,
                                {
                                relationship: value,
                                }
                            )

                            setFerretData(
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
                      ferretData.hunger === value
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
                            await updateFerretModuleData(
                                characterModule.id,
                                {
                                hunger: value,
                                }
                            )

                            setFerretData(
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
                                await updateFerretAbility(
                                    ability.id,
                                    {
                                    name: event.target.value,
                                    }
                                )

                                if (!updatedAbility) {
                                setSaveStatus('error')
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
                            await updateFerretAbility(
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

                            setFerretAbilities(
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
      </section>
    </>
  )
}

export default CharacterModulePage