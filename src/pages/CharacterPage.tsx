import {
  useEffect,
  useState,
} from 'react'

import {
  getOrCreateCharacter,
  updateCharacter,
} from '../data/repository'

import type {
  Campaign,
  Character,
  CharacterAttribute,
} from '../data/database'

type AttributeKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma'

const attributes: {
  key: AttributeKey
  label: string
}[] = [
  {
    key: 'strength',
    label: 'STR',
  },
  {
    key: 'dexterity',
    label: 'DEX',
  },
  {
    key: 'constitution',
    label: 'CON',
  },
  {
    key: 'intelligence',
    label: 'INT',
  },
  {
    key: 'wisdom',
    label: 'WIS',
  },
  {
    key: 'charisma',
    label: 'CHA',
  },
]

function numberFromInput(
  value: string
) {
  if (value === '') {
    return null
  }

  const parsed =
    Number(value)

  if (
    Number.isNaN(parsed)
  ) {
    return null
  }

  return parsed
}

export default function CharacterPage({
  campaign,
}: {
  campaign: Campaign
}) {
  const [
    character,
    setCharacter,
  ] = useState<
    Character | undefined
  >()

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    saveStatus,
    setSaveStatus,
  ] = useState<
    'saved' | 'saving' | 'error'
  >('saved')

  useEffect(() => {
    async function loadCharacter() {
      try {
        const result =
          await getOrCreateCharacter(
            campaign.id
          )

        setCharacter(result)
      } catch (error) {
        console.error(
          'Could not load Character.',
          error
        )

        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCharacter()
  }, [campaign.id])

  useEffect(() => {
    if (!character) {
      return
    }

    setSaveStatus('saving')

    const timer =
      window.setTimeout(
        async () => {
          try {
            const updated =
              await updateCharacter(
                character.id,
                {
                  name:
                    character.name,
                  ancestry:
                    character.ancestry,
                  characterClass:
                    character.characterClass,

                  level:
                    character.level,
                  xp: character.xp,

                  title:
                    character.title,
                  alignment:
                    character.alignment,
                  background:
                    character.background,
                  deity:
                    character.deity,

                  strength:
                    character.strength,
                  dexterity:
                    character.dexterity,
                  constitution:
                    character.constitution,
                  intelligence:
                    character.intelligence,
                  wisdom:
                    character.wisdom,
                  charisma:
                    character.charisma,

                  currentHp:
                    character.currentHp,
                  maxHp:
                    character.maxHp,
                  armorClass:
                    character.armorClass,

                  attacks:
                    character.attacks,
                  talentsAndSpells:
                    character.talentsAndSpells,

                  gear:
                    character.gear,
                  freeToCarry:
                    character.freeToCarry,

                  gp: character.gp,
                  sp: character.sp,
                  cp: character.cp,
                }
              )

            if (updated) {
              setSaveStatus(
                'saved'
              )
            }
          } catch (error) {
            console.error(
              'Could not save Character.',
              error
            )

            setSaveStatus(
              'error'
            )
          }
        },
        500
      )

    return () => {
      window.clearTimeout(
        timer
      )
    }
  }, [character])

  function updateTextField(
    field:
      | 'name'
      | 'ancestry'
      | 'characterClass'
      | 'title'
      | 'alignment'
      | 'background'
      | 'deity'
      | 'attacks'
      | 'talentsAndSpells'
      | 'freeToCarry',
    value: string
  ) {
    setCharacter(
      (current) =>
        current
          ? {
              ...current,
              [field]: value,
            }
          : current
    )
  }

  function updateNumberField(
    field:
      | 'level'
      | 'xp'
      | 'currentHp'
      | 'maxHp'
      | 'armorClass'
      | 'gp'
      | 'sp'
      | 'cp',
    value: string
  ) {
    setCharacter(
      (current) =>
        current
          ? {
              ...current,
              [field]:
                numberFromInput(
                  value
                ),
            }
          : current
    )
  }

  function updateAttribute(
    key: AttributeKey,
    field:
      keyof CharacterAttribute,
    value: string
  ) {
    setCharacter(
      (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          [key]: {
            ...current[key],
            [field]:
              numberFromInput(
                value
              ),
          },
        }
      }
    )
  }

  function updateGear(
    index: number,
    value: string
  ) {
    setCharacter(
      (current) => {
        if (!current) {
          return current
        }

        const gear = [
          ...current.gear,
        ]

        while (
          gear.length < 20
        ) {
          gear.push('')
        }

        gear[index] = value

        return {
          ...current,
          gear,
        }
      }
    )
  }

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>
            Character
          </h1>

          <p className="subtitle">
            Loading Character…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  if (!character) {
    return (
      <>
        <section className="page left-page">
          <h1>
            Character
          </h1>

          <p className="form-error">
            Character could not
            be loaded.
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  const gear =
    Array.from(
      { length: 20 },
      (_, index) =>
        character.gear[index] ??
        ''
    )

  return (
    <>
      <section className="page left-page character-page distress-b">
        <div className="character-save-row">
          <span className="character-save-status">
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
                ? 'Save error'
                : 'Saved'}
          </span>
        </div>

        <div className="character-heading compact-character-heading">
          <label className="character-name-field">
                <span>Character Name</span>

                <input
                value={character.name}
                onChange={(event) =>
                    updateTextField(
                    'name',
                    event.target.value
                    )
                }
                placeholder="Character name"
                />
            </label>

            <label className="character-field">
                <span>Level</span>

                <input
                type="number"
                value={character.level ?? ''}
                onChange={(event) =>
                    updateNumberField(
                    'level',
                    event.target.value
                    )
                }
                />
            </label>

            <label className="character-field">
                <span>XP</span>

                <input
                type="number"
                value={character.xp ?? ''}
                onChange={(event) =>
                    updateNumberField(
                    'xp',
                    event.target.value
                    )
                }
                />
            </label>

            </div>

            <div className="character-section character-identity-compact">
            <div className="character-form-grid">
                <label className="character-field">
                <span>Ancestry</span>

                <input
                    value={character.ancestry}
                    onChange={(event) =>
                    updateTextField(
                        'ancestry',
                        event.target.value
                    )
                    }
                />
                </label>

                <label className="character-field">
                <span>Class</span>

                <input
                    value={character.characterClass}
                    onChange={(event) =>
                    updateTextField(
                        'characterClass',
                        event.target.value
                    )
                    }
                />
                </label>

                <label className="character-field">
                <span>Title</span>

                <input
                    value={character.title}
                    onChange={(event) =>
                    updateTextField(
                        'title',
                        event.target.value
                    )
                    }
                />
                </label>

                <label className="character-field">
                <span>Alignment</span>

                <input
                    value={character.alignment}
                    onChange={(event) =>
                    updateTextField(
                        'alignment',
                        event.target.value
                    )
                    }
                />
                </label>

                <label className="character-field">
                <span>Background</span>

                <input
                    value={character.background}
                    onChange={(event) =>
                    updateTextField(
                        'background',
                        event.target.value
                    )
                    }
                />
                </label>

                <label className="character-field">
                <span>Deity</span>

                <input
                    value={character.deity}
                    onChange={(event) =>
                    updateTextField(
                        'deity',
                        event.target.value
                    )
                    }
                />
                </label>
            </div>
            </div>

        <div className="character-section">
        <h2>Attributes</h2>

        <div className="attribute-grid">
            {attributes.map((attribute) => (
            <div
                className="attribute-card"
                key={attribute.key}
            >
                <strong>
                {attribute.label}
                </strong>

                <label>
                <span>Score</span>

                <input
                    type="number"
                    value={
                    character[
                        attribute.key
                    ].score ?? ''
                    }
                    onChange={(event) =>
                    updateAttribute(
                        attribute.key,
                        'score',
                        event.target.value
                    )
                    }
                />
                </label>

                <label>
                <span>Mod</span>

                <input
                    type="number"
                    value={
                    character[
                        attribute.key
                    ].modifier ?? ''
                    }
                    onChange={(event) =>
                    updateAttribute(
                        attribute.key,
                        'modifier',
                        event.target.value
                    )
                    }
                />
                </label>
            </div>
            ))}
        </div>
        </div>

        <div className="character-section">
          <h2>Combat</h2>

          <div className="combat-layout">
            <div className="combat-stats">
              <label className="character-field">
                <span>Current HP</span>

                <input
                  type="number"
                  value={character.currentHp ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'currentHp',
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="character-field">
                <span>Max HP</span>

                <input
                  type="number"
                  value={character.maxHp ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'maxHp',
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="character-field">
                <span>AC</span>

                <input
                  type="number"
                  value={character.armorClass ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'armorClass',
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <label className="character-field combat-attacks">
              <span>Attacks</span>

              <textarea
                value={character.attacks}
                onChange={(event) =>
                  updateTextField(
                    'attacks',
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="page right-page character-page distress-e">
        <div className="character-right-top">
          <div className="character-section character-section-first">
            <h2>Talents / Spells</h2>

            <textarea
              className="talents-textarea"
              value={character.talentsAndSpells}
              onChange={(event) =>
                updateTextField(
                  'talentsAndSpells',
                  event.target.value
                )
              }
            />
          </div>

          <div className="character-section character-section-first character-currency">
            <h2>Currency</h2>

            <div className="currency-stack">
              <label className="character-field">
                <span>GP</span>

                <input
                  type="number"
                  value={character.gp ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'gp',
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="character-field">
                <span>SP</span>

                <input
                  type="number"
                  value={character.sp ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'sp',
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="character-field">
                <span>CP</span>

                <input
                  type="number"
                  value={character.cp ?? ''}
                  onChange={(event) =>
                    updateNumberField(
                      'cp',
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="character-section">
          <h2>Gear</h2>

          <div className="gear-layout">
            <div className="gear-columns">
              <div className="gear-column">
                {gear
                  .slice(0, 10)
                  .map(
                    (
                      gearItem,
                      index
                    ) => (
                      <label
                        className="gear-slot"
                        key={index}
                      >
                        <span>
                          {index + 1}.
                        </span>

                        <input
                          value={gearItem}
                          onChange={(event) =>
                            updateGear(
                              index,
                              event.target.value
                            )
                          }
                        />
                      </label>
                    )
                  )}
              </div>

              <div className="gear-column">
                {gear
                  .slice(10, 20)
                  .map(
                    (
                      gearItem,
                      index
                    ) => {
                      const gearIndex =
                        index + 10

                      return (
                        <label
                          className="gear-slot"
                          key={gearIndex}
                        >
                          <span>
                            {gearIndex + 1}.
                          </span>

                          <input
                            value={gearItem}
                            onChange={(event) =>
                              updateGear(
                                gearIndex,
                                event.target.value
                              )
                            }
                          />
                        </label>
                      )
                    }
                  )}
              </div>
            </div>

            <label className="character-field free-carry-side">
              <span>Free to Carry</span>

              <textarea
                value={character.freeToCarry}
                onChange={(event) =>
                  updateTextField(
                    'freeToCarry',
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </div>
      </section>
    </>
  )
}