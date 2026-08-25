import {
  useEffect,
  useState,
} from 'react'

import {
  addGoal,
  completeGoal,
  deleteGoal,
  getGoals,
  reopenGoal,
  updateGoal,
} from '../data/repository'

import type {
  Campaign,
  Goal,
  GoalTerm,
} from '../data/database'

const goalSections: {
  term: GoalTerm
  title: string
}[] = [
  {
    term: 'short',
    title: 'Short Term',
  },
  {
    term: 'mid',
    title: 'Mid Term',
  },
  {
    term: 'long',
    title: 'Long Term',
  },
]

export default function GoalsPage({
  campaign,
}: {
  campaign: Campaign
}) {
  const [
    goals,
    setGoals,
  ] = useState<Goal[]>([])

  const [
    selectedGoalId,
    setSelectedGoalId,
  ] = useState<string | undefined>()

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
    async function loadGoals() {
      try {
        const result =
          await getGoals(
            campaign.id
          )

        setGoals(result)

        const firstActive =
          result.find(
            (goal) =>
              goal.status ===
              'active'
          )

        setSelectedGoalId(
          firstActive?.id ??
            result[0]?.id
        )
      } catch (error) {
        console.error(
          'Could not load Goals.',
          error
        )

        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadGoals()
  }, [campaign.id])

  const selectedGoal =
    goals.find(
      (goal) =>
        goal.id ===
        selectedGoalId
    )

  async function handleAddGoal(
    term: GoalTerm
  ) {
    try {
      const goal =
        await addGoal(
          campaign.id,
          term
        )

      setGoals(
        (current) => [
          ...current,
          goal,
        ]
      )

      setSelectedGoalId(
        goal.id
      )
    } catch (error) {
      console.error(
        'Could not add Goal.',
        error
      )

      setSaveStatus('error')
    }
  }

  function changeSelectedGoal(
    changes: Partial<Goal>
  ) {
    if (!selectedGoal) {
      return
    }

    setGoals(
      (current) =>
        current.map(
          (goal) =>
            goal.id ===
            selectedGoal.id
              ? {
                  ...goal,
                  ...changes,
                }
              : goal
        )
    )
  }

  useEffect(() => {
    if (!selectedGoal) {
      return
    }

    setSaveStatus('saving')

    const timer =
      window.setTimeout(
        async () => {
          try {
            await updateGoal(
              selectedGoal.id,
              {
                title:
                  selectedGoal.title,
                term:
                  selectedGoal.term,
                background:
                  selectedGoal.background,
                goal:
                  selectedGoal.goal,
                howToMeasure:
                  selectedGoal.howToMeasure,
                downside:
                  selectedGoal.downside,
                hasSetback:
                  selectedGoal.hasSetback,
              }
            )

            setSaveStatus(
              'saved'
            )
          } catch (error) {
            console.error(
              'Could not save Goal.',
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
  }, [
    selectedGoal?.id,
    selectedGoal?.title,
    selectedGoal?.term,
    selectedGoal?.background,
    selectedGoal?.goal,
    selectedGoal?.howToMeasure,
    selectedGoal?.downside,
    selectedGoal?.hasSetback,
  ])

  async function handleComplete() {
    if (!selectedGoal) {
      return
    }

    try {
      const updated =
        await completeGoal(
          selectedGoal.id
        )

      if (!updated) {
        return
      }

      setGoals(
        (current) =>
          current.map(
            (goal) =>
              goal.id ===
              updated.id
                ? updated
                : goal
          )
      )
    } catch (error) {
      console.error(
        'Could not complete Goal.',
        error
      )
    }
  }

  async function handleReopen() {
    if (!selectedGoal) {
      return
    }

    try {
      const updated =
        await reopenGoal(
          selectedGoal.id
        )

      if (!updated) {
        return
      }

      setGoals(
        (current) =>
          current.map(
            (goal) =>
              goal.id ===
              updated.id
                ? updated
                : goal
          )
      )
    } catch (error) {
      console.error(
        'Could not reopen Goal.',
        error
      )
    }
  }

  async function handleDelete() {
    if (!selectedGoal) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${
          selectedGoal.title ||
          'Untitled Goal'
        }"?`
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteGoal(
        selectedGoal.id
      )

      const remaining =
        goals.filter(
          (goal) =>
            goal.id !==
            selectedGoal.id
        )

      setGoals(remaining)

      setSelectedGoalId(
        remaining.find(
          (goal) =>
            goal.status ===
            'active'
        )?.id ??
          remaining[0]?.id
      )
    } catch (error) {
      console.error(
        'Could not delete Goal.',
        error
      )
    }
  }

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>Goals</h1>

          <p className="subtitle">
            Loading Goals…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  return (
    <>
      <section className="page left-page goals-page">
        <div className="goals-heading">
          <div>
            <h1>Goals</h1>

            <p className="subtitle">
              What matters next
            </p>
          </div>

          <span className="goal-save-status">
            {saveStatus ===
            'saving'
              ? 'Saving…'
              : saveStatus ===
                  'error'
                ? 'Save error'
                : 'Saved'}
          </span>
        </div>

        {goalSections.map(
          (section) => {
            const activeGoals =
              goals.filter(
                (goal) =>
                  goal.term ===
                    section.term &&
                  goal.status ===
                    'active'
              )

            return (
              <div
                className="goal-term-section"
                key={section.term}
              >
                <div className="goal-term-heading">
                  <h2>
                    {section.title}
                  </h2>

                  <button
                    className="goal-add-button"
                    onClick={() =>
                      void handleAddGoal(
                        section.term
                      )
                    }
                  >
                    + Add
                  </button>
                </div>

                {activeGoals.length ===
                0 ? (
                  <p className="goal-empty">
                    No active goals.
                  </p>
                ) : (
                  <div className="goal-list">
                    {activeGoals.map(
                      (goal) => (
                        <button
                          key={goal.id}
                          className={
                            goal.id ===
                            selectedGoalId
                              ? 'goal-list-item active'
                              : 'goal-list-item'
                          }
                          onClick={() =>
                            setSelectedGoalId(
                              goal.id
                            )
                          }
                        >
                          <span>
                            {goal.title ||
                              'Untitled Goal'}
                          </span>

                          {goal.hasSetback && (
                            <span className="goal-setback-badge">
                              Setback
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          }
        )}

        {goals.some(
          (goal) =>
            goal.status ===
            'completed'
        ) && (
          <div className="goal-term-section completed-goals-section">
            <h2>
              Completed
            </h2>

            <div className="goal-list">
              {goals
                .filter(
                  (goal) =>
                    goal.status ===
                    'completed'
                )
                .map((goal) => (
                  <button
                    key={goal.id}
                    className={
                      goal.id ===
                      selectedGoalId
                        ? 'goal-list-item completed active'
                        : 'goal-list-item completed'
                    }
                    onClick={() =>
                      setSelectedGoalId(
                        goal.id
                      )
                    }
                  >
                    <span>
                      {goal.title ||
                        'Untitled Goal'}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </section>

      <section className="page right-page goals-page">
        {selectedGoal ? (
          <>
            <div className="goal-editor-heading">
              <div>
                <h1>
                  {selectedGoal.title ||
                    'New Goal'}
                </h1>

                <p className="subtitle">
                  {selectedGoal.status ===
                  'completed'
                    ? 'Completed'
                    : selectedGoal.hasSetback
                      ? 'Active — Setback'
                      : 'Active'}
                </p>
              </div>
            </div>

            <div className="goal-editor">
              <div className="goal-editor-top">
                <label className="character-field">
                  <span>
                    Title
                  </span>

                  <input
                    value={
                      selectedGoal.title
                    }
                    onChange={(event) =>
                      changeSelectedGoal(
                        {
                          title:
                            event.target
                              .value,
                        }
                      )
                    }
                    placeholder="Short name for this goal"
                  />
                </label>

                <label className="character-field">
                  <span>
                    Term
                  </span>

                  <select
                    className="goal-term-select"
                    value={
                      selectedGoal.term
                    }
                    onChange={(event) =>
                      changeSelectedGoal(
                        {
                          term:
                            event.target
                              .value as GoalTerm,
                        }
                      )
                    }
                  >
                    <option value="short">
                      Short Term
                    </option>

                    <option value="mid">
                      Mid Term
                    </option>

                    <option value="long">
                      Long Term
                    </option>
                  </select>
                </label>
              </div>

              <label className="character-field goal-notes-field">
                <span>
                  Background
                </span>

                <textarea
                  value={
                    selectedGoal.background
                  }
                  onChange={(event) =>
                    changeSelectedGoal(
                      {
                        background:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="Why does this matter? What led to this goal?"
                />
              </label>

              <label className="character-field goal-notes-field">
                <span>
                  Goal
                </span>

                <textarea
                  value={
                    selectedGoal.goal
                  }
                  onChange={(event) =>
                    changeSelectedGoal(
                      {
                        goal:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="What are you actually trying to achieve?"
                />
              </label>

              <label className="character-field goal-notes-field">
                <span>
                  How to Measure
                </span>

                <textarea
                  value={
                    selectedGoal.howToMeasure
                  }
                  onChange={(event) =>
                    changeSelectedGoal(
                      {
                        howToMeasure:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="What actions, events or outcomes count as progress?"
                />
              </label>

              <label className="character-field goal-notes-field">
                <span>
                  Downside
                </span>

                <textarea
                  value={
                    selectedGoal.downside
                  }
                  onChange={(event) =>
                    changeSelectedGoal(
                      {
                        downside:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="What is at risk if this goes badly or is not achieved?"
                />
              </label>

              <label className="goal-setback-toggle">
                <input
                  type="checkbox"
                  checked={
                    selectedGoal.hasSetback
                  }
                  onChange={(event) =>
                    changeSelectedGoal(
                      {
                        hasSetback:
                          event.target
                            .checked,
                      }
                    )
                  }
                />

                <span>
                  Setback
                </span>
              </label>

              <div className="goal-actions">
                {selectedGoal.status ===
                'active' ? (
                  <button
                    className="goal-complete-button"
                    onClick={() =>
                      void handleComplete()
                    }
                  >
                    Complete Goal
                  </button>
                ) : (
                  <button
                    className="goal-reopen-button"
                    onClick={() =>
                      void handleReopen()
                    }
                  >
                    Reopen Goal
                  </button>
                )}

                <button
                  className="goal-delete-button"
                  onClick={() =>
                    void handleDelete()
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="goal-no-selection">
            <h1>Goals</h1>

            <p className="subtitle">
              Add a Short, Mid or Long
              Term goal to get started.
            </p>
          </div>
        )}
      </section>
    </>
  )
}