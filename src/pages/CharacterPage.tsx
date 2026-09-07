import {
  useEffect,
  useState,
} from 'react'

import {
  getOrCreateCharacter,
  getEquipmentItems,
  updateCharacter,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem
} from '../data/repository'

import type {
  Campaign,
  Character,
  EquipmentItem,
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

  const [
      equipmentItems,
      setEquipmentItems,
    ] = useState<EquipmentItem[]>([])

  const [
    selectedGearIndex,
    setSelectedGearIndex,
  ] = useState<number | null>(null)

  const [
    equipmentNameDraft,
    setEquipmentNameDraft,
  ] = useState('')

  const [
    equipmentTypeDraft,
    setEquipmentTypeDraft,
  ] = useState<
    'weapon' | 'armor' | 'gear' | 'gem'
  >('gear')

  const [
    equipmentQuantityDraft,
    setEquipmentQuantityDraft,
  ] = useState('1')

  const [
    equipmentSlotsDraft,
    setEquipmentSlotsDraft,
  ] = useState(0)

  const [
    equipmentCostValueDraft,
    setEquipmentCostValueDraft,
  ] = useState('')

  const [
    equipmentDescriptionDraft,
    setEquipmentDescriptionDraft,
  ] = useState('')

  const [
    equipmentDamageDraft,
    setEquipmentDamageDraft,
  ] = useState('')

  const [
    equipmentRangeDraft,
    setEquipmentRangeDraft,
  ] = useState('')

  const [
    equipmentPropertiesDraft,
    setEquipmentPropertiesDraft,
  ] = useState('')

  const [
    equipmentArmorClassDraft,
    setEquipmentArmorClassDraft,
  ] = useState('')

  const [
    equipmentWeaponTypeDraft,
    setEquipmentWeaponTypeDraft,
  ] = useState('')

  useEffect(() => {
    async function loadCharacter() {
      try {
        const result =
          await getOrCreateCharacter(
            campaign.id
          )

        const equipment =
          await getEquipmentItems(
            result.id
          )

        setCharacter(result)

        setEquipmentItems(
          equipment
        )
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
                  xpToNextLevel:
                    character.xpToNextLevel,

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

                  gear: character.gear,
                  maxGearCapacity: character.maxGearCapacity,
                  freeToCarry: character.freeToCarry,

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

  useEffect(() => {
    if (
      !character ||
      selectedGearIndex === null
    ) {
      return
    }

    const name =
      equipmentNameDraft.trim()

    if (!name) {
      return
    }

    const timeout = window.setTimeout(() => {
      void saveEquipmentName()
    }, 400)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    character,
    selectedGearIndex,
    equipmentNameDraft,
    equipmentTypeDraft,
    equipmentQuantityDraft,
    equipmentSlotsDraft,
    equipmentCostValueDraft,
    equipmentDescriptionDraft,
    equipmentDamageDraft,
    equipmentRangeDraft,
    equipmentWeaponTypeDraft,
    equipmentPropertiesDraft,
    equipmentArmorClassDraft,
  ])

  async function deleteSelectedEquipmentItem() {
    if (!selectedEquipmentItem) {
      return
    }

    const confirmed = window.confirm(
      `Remove "${selectedEquipmentItem.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteEquipmentItem(
        selectedEquipmentItem.id
      )

      setEquipmentItems((current) =>
        current.filter(
          (item) =>
            item.id !==
            selectedEquipmentItem.id
        )
      )

      setSelectedGearIndex(null)
    } catch (error) {
      console.error(
        'Could not remove equipment item.',
        error
      )
    }
  }

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
      | 'xpToNextLevel'
      | 'currentHp'
      | 'maxHp'
      | 'armorClass'
      | 'maxGearCapacity'
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

  async function saveEquipmentName() {
    if (
      !character ||
      selectedGearIndex === null
    ) {
      return
    }

    const name =
      equipmentNameDraft.trim()

    if (!name) {
      return
    }

    try {
      const existingItem =
        equipmentItems.find(
          (item) =>
            item.sortPosition ===
            selectedGearIndex
        )

      if (existingItem) {
        const updated =
          await updateEquipmentItem(
            existingItem.id,
            {
            name,
            type: equipmentTypeDraft,
            quantity: equipmentQuantityDraft,
            gearSlots: equipmentSlotsDraft,
            costValue: equipmentCostValueDraft,
            description: equipmentDescriptionDraft,
            damage: equipmentDamageDraft,
            range: equipmentRangeDraft,
            weaponType: equipmentWeaponTypeDraft,
            properties: equipmentPropertiesDraft,
            armorClass: equipmentArmorClassDraft,
          }
          )

        if (updated) {
          setEquipmentItems(
            (current) =>
              current.map((item) =>
                item.id === updated.id
                  ? updated
                  : item
              )
          )
        }
      } else {
        const created =
          await createEquipmentItem(
            campaign.id,
            character.id,
            selectedGearIndex,
            name
          )

          const updated =
            await updateEquipmentItem(
              created.id,
              {
                type: equipmentTypeDraft,
                quantity: equipmentQuantityDraft,
                gearSlots: equipmentSlotsDraft,
                costValue: equipmentCostValueDraft,
                description: equipmentDescriptionDraft,
                damage: equipmentDamageDraft,
                range: equipmentRangeDraft,
                weaponType: equipmentWeaponTypeDraft,
                properties: equipmentPropertiesDraft,
                armorClass: equipmentArmorClassDraft,
              }
            )

        setEquipmentItems(
          (current) => [
            ...current,
            updated ?? created,
          ]
        )
      }

    } catch (error) {
      console.error(
        'Could not save equipment item.',
        error
      )
    }
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
        equipmentItems.find(
          (item) =>
            item.sortPosition === index
        ) ?? null
    )

  const usedGearCapacity =
    equipmentItems.reduce(
      (total, item) =>
        total + item.gearSlots,
      0
    )

  const selectedEquipmentItem =
    selectedGearIndex !== null
      ? gear[selectedGearIndex]
      : null

  return (
    <>
      <section className="page left-page character-page distress-b">
        <div className="character-heading compact-character-heading">
          <label className="character-name-field">
            <span className="character-name-label">
              <span>Character Name</span>

              <span className="character-save-status">
                {saveStatus === 'saving'
                  ? 'Saving…'
                  : saveStatus === 'error'
                    ? 'Save error'
                    : 'Saved'}
              </span>
            </span>

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
            <label className="character-field">
                <span>XP to Next Level</span>

                <input
                type="number"
                value={
                    character.xpToNextLevel ?? ''
                }
                onChange={(event) =>
                    updateNumberField(
                    'xpToNextLevel',
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

        <div className="character-section">
          <div className="gear-currency-row">
            <div className="gear-area">
              <div className="gear-heading-row">
                <h2>Gear</h2>

                <label className="gear-capacity">
                  <span>Capacity</span>

                  <div className="gear-capacity-values">
                    <strong>{usedGearCapacity}</strong>
                    <span>/</span>
                    <input
                      type="number"
                      min="0"
                      value={
                        character.maxGearCapacity ?? ''
                      }
                      onChange={(event) =>
                        updateNumberField(
                          'maxGearCapacity',
                          event.target.value
                        )
                      }
                      aria-label="Maximum gear capacity"
                    />
                  </div>
                </label>
          </div>

          <div className="gear-layout">
            <div className="gear-columns">
              <div className="gear-column">
                {gear
                  .slice(0, 10)
                  .map(
                    (
                      gearItem,
                      index
                    ) => {
                      const isBeyondCapacity =
                        character.maxGearCapacity !== null &&
                        index >= character.maxGearCapacity

                      const isUnavailable =
                        isBeyondCapacity && !gearItem

                      return (
                        <button
                        type="button"
                        className={
                          `gear-slot${
                            isBeyondCapacity
                              ? ' gear-slot-unavailable'
                              : ''
                          }`
                        }
                        disabled={isUnavailable}
                        key={index}
                        onClick={() => {
                          setSelectedGearIndex(index)
                          setEquipmentNameDraft(
                            gearItem?.name ?? ''
                          )
                          setEquipmentTypeDraft(
                            gearItem?.type ?? 'gear'
                          )
                          setEquipmentQuantityDraft(
                            gearItem?.quantity ?? '1'
                          )
                          setEquipmentSlotsDraft(
                            gearItem?.gearSlots ?? 0
                          )
                          setEquipmentCostValueDraft(
                            gearItem?.costValue ?? ''
                          )
                          setEquipmentDescriptionDraft(
                            gearItem?.description ?? ''
                          )
                          setEquipmentDamageDraft(
                            gearItem?.damage ?? ''
                          )
                          setEquipmentWeaponTypeDraft(
                            gearItem?.weaponType ?? ''
                          )
                          setEquipmentRangeDraft(
                            gearItem?.range ?? ''
                          )
                          setEquipmentPropertiesDraft(
                            gearItem?.properties ?? ''
                          )
                          setEquipmentArmorClassDraft(
                            gearItem?.armorClass ?? ''
                          )
                          setEquipmentWeaponTypeDraft(
                            gearItem?.weaponType ?? ''
                          )
                        }}
                      >
                        <span>
                          {index + 1}.
                        </span>

                        <span>
                          {gearItem?.name ?? '—'}
                        </span>
                      </button>
                    )
                  }
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

                      const isBeyondCapacity =
                        character.maxGearCapacity !== null &&
                        gearIndex >= character.maxGearCapacity

                      const isUnavailable =
                        isBeyondCapacity && !gearItem

                      return (
                        <button
                          type="button"
                          className={
                            `gear-slot${
                              isBeyondCapacity
                                ? ' gear-slot-unavailable'
                                : ''
                            }`
                          }
                          disabled={isUnavailable}
                          key={gearIndex}
                          onClick={() => {
                            setSelectedGearIndex(
                              gearIndex
                            )
                            setEquipmentNameDraft(
                              gearItem?.name ?? ''
                            )
                            setEquipmentTypeDraft(
                              gearItem?.type ?? 'gear'
                            )
                            setEquipmentQuantityDraft(
                              gearItem?.quantity ?? '1'
                            )
                            setEquipmentSlotsDraft(
                              gearItem?.gearSlots ?? 0
                            )
                            setEquipmentCostValueDraft(
                              gearItem?.costValue ?? ''
                            )
                            setEquipmentDescriptionDraft(
                              gearItem?.description ?? ''
                            )
                            setEquipmentDamageDraft(
                              gearItem?.damage ?? ''
                            )
                            setEquipmentWeaponTypeDraft(
                              gearItem?.weaponType ?? ''
                            )
                            setEquipmentRangeDraft(
                              gearItem?.range ?? ''
                            )
                            setEquipmentPropertiesDraft(
                              gearItem?.properties ?? ''
                            )
                            setEquipmentArmorClassDraft(
                              gearItem?.armorClass ?? ''
                            )
                            setEquipmentWeaponTypeDraft(
                              gearItem?.weaponType ?? ''
                            )
                          }}
                        >
                          <span>
                            {gearIndex + 1}.
                          </span>

                          <span>
                            {gearItem?.name ?? '—'}
                          </span>
                        </button>
                      )
                    }
                  )}
              </div>
            </div>
          </div>
          </div>
          <div className="character-currency gear-currency-side">
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
          <label className="character-field free-carry-bottom">
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
      </section>

      {selectedGearIndex !== null ? (
        <div
          className="equipment-detail-backdrop"
          onClick={() =>
            setSelectedGearIndex(null)
          }
        >
          <div
            className="equipment-detail-card"
            style={
              {
                '--equipment-distress-x':
                  `${(selectedGearIndex * 37) % 100}%`,
                '--equipment-distress-y':
                  `${(selectedGearIndex * 61) % 100}%`,
                '--equipment-distress-size':
                  `${135 + ((selectedGearIndex * 23) % 70)}%`,
              } as React.CSSProperties
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="equipment-detail-close"
              onClick={() =>
                setSelectedGearIndex(null)
              }
            >
              ×
            </button>

            <input
              className="equipment-detail-name"
              type="text"
              value={equipmentNameDraft}
              onChange={(event) =>
                setEquipmentNameDraft(
                  event.target.value
                )
              }
              placeholder="Equipment"
            />

            <div className="equipment-detail-stats">
              <label className="character-field">
                <span>Type</span>

                <select
                  value={equipmentTypeDraft}
                  onChange={(event) =>
                    setEquipmentTypeDraft(
                      event.target.value as
                        | 'weapon'
                        | 'armor'
                        | 'gear'
                        | 'gem'
                    )
                  }
                >
                  <option value="weapon">
                    Weapon
                  </option>

                  <option value="armor">
                    Armor
                  </option>

                  <option value="gear">
                    Gear
                  </option>

                  <option value="gem">
                    Gems
                  </option>
                </select>
              </label>
              {equipmentTypeDraft !== 'weapon' &&
                equipmentTypeDraft !== 'armor' ? (
                  <label className="character-field">
                    <span>Quantity</span>

                    <input
                      type="text"
                      value={equipmentQuantityDraft}
                      onChange={(event) =>
                        setEquipmentQuantityDraft(
                          event.target.value
                        )
                      }
                    />
                  </label>
                ) : null}
            </div>
            <label className="character-field">
              <span>Description</span>

              <textarea
                value={equipmentDescriptionDraft}
                onChange={(event) =>
                  setEquipmentDescriptionDraft(
                    event.target.value
                  )
                }
              />
            </label>
            {equipmentTypeDraft === 'weapon' ? (
              <>
              <div className="equipment-weapon-stats">
                <label className="character-field">
                  <span>Damage</span>

                  <input
                    type="text"
                    value={equipmentDamageDraft}
                    onChange={(event) =>
                      setEquipmentDamageDraft(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="character-field">
                  <span>Weapon Type</span>

                  <input
                    type="text"
                    value={equipmentWeaponTypeDraft}
                    onChange={(event) =>
                      setEquipmentWeaponTypeDraft(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="character-field">
                  <span>Range</span>

                  <input
                    type="text"
                    value={equipmentRangeDraft}
                    onChange={(event) =>
                      setEquipmentRangeDraft(
                        event.target.value
                      )
                    }
                  />
                </label>
                </div>
                <label className="character-field">
                  <span>Properties</span>

                  <input
                    type="text"
                    value={equipmentPropertiesDraft}
                    onChange={(event) =>
                      setEquipmentPropertiesDraft(
                        event.target.value
                      )
                    }
                  />
                </label>
              </>
            ) : null}
            {equipmentTypeDraft === 'armor' ? (
              <>
                <div className="equipment-armor-stats">
                <label className="character-field">
                  <span>Armor Class</span>

                  <input
                    type="text"
                    value={equipmentArmorClassDraft}
                    onChange={(event) =>
                      setEquipmentArmorClassDraft(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="character-field">
                  <span>Properties</span>

                  <input
                    type="text"
                    value={equipmentPropertiesDraft}
                    onChange={(event) =>
                      setEquipmentPropertiesDraft(
                        event.target.value
                      )
                    }
                  />
                </label>
                </div>
              </>
            ) : null}
<div className="equipment-detail-footer-stats">
              <label className="character-field">
                <span>Slots</span>

                <input
                  type="number"
                  min="0"
                  value={equipmentSlotsDraft}
                  onChange={(event) =>
                    setEquipmentSlotsDraft(
                      Number(event.target.value)
                    )
                  }
                />
              </label>

              <label className="character-field">
                <span>Cost / Value</span>

                <input
                  type="text"
                  value={equipmentCostValueDraft}
                  onChange={(event) =>
                    setEquipmentCostValueDraft(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
            {selectedEquipmentItem ? (
              <button
                type="button"
                className="equipment-remove-button"
                onClick={() => {
                  void deleteSelectedEquipmentItem()
                }}
              >
                Remove Item
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}