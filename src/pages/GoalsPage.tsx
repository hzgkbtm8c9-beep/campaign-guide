import {
  useEffect,
  useRef,
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

import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'
import { SaveStatus } from '../components/SaveStatus'
import GuideHelpButton from '../components/GuideHelpButton'
import ConfirmModal from '../components/ConfirmModal'

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
    goalPendingDeletion,
    setGoalPendingDeletion,
  ] = useState<Goal | null>(null)

  const [
    isDeletingGoal,
    setIsDeletingGoal,
  ] = useState(false)

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

  const goalEditorRef =
    useRef<HTMLTextAreaElement | null>(
      null
    )

  const measureEditorRef =
    useRef<HTMLTextAreaElement | null>(
      null
    )

  const downsideEditorRef =
    useRef<HTMLTextAreaElement | null>(
      null
    )

  useAutoGrowTextarea(
    goalEditorRef,
    selectedGoal?.goal ?? ''
  )

  useAutoGrowTextarea(
    measureEditorRef,
    selectedGoal?.howToMeasure ?? ''
  )

  useAutoGrowTextarea(
    downsideEditorRef,
    selectedGoal?.downside ?? ''
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
                pinnedToToday:
                  selectedGoal.pinnedToToday,
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
    selectedGoal?.pinnedToToday,
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
    if (
      !goalPendingDeletion ||
      isDeletingGoal
    ) {
      return
    }

    const goalToDelete =
      goalPendingDeletion

    try {
      setIsDeletingGoal(true)

      await deleteGoal(
        goalToDelete.id
      )

      const remaining =
        goals.filter(
          (goal) =>
            goal.id !==
            goalToDelete.id
        )

      setGoals(remaining)

      if (
        selectedGoalId ===
        goalToDelete.id
      ) {
        setSelectedGoalId(
          remaining.find(
            (goal) =>
              goal.status ===
              'active'
          )?.id ??
            remaining[0]?.id
        )
      }

      setGoalPendingDeletion(null)
    } catch (error) {
      console.error(
        'Could not delete Goal.',
        error
      )
    } finally {
      setIsDeletingGoal(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1 className="page-title">Goals</h1>

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
      <section className="page left-page goals-page distress-c">
        <div className="page-heading-with-status">
          <div className="page-heading-copy">
            <h1 className="page-title">Goals</h1>

            <p className="page-intro">
              Ambitions worth chasing, before the dungeon has other ideas.
            </p>
          </div>

                    <div className="page-heading-actions">
            <SaveStatus
              status={saveStatus}
              className="goal-save-status"
            />

            <GuideHelpButton topicId="goals" />
          </div>
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
                  <h2 className="section-title">{section.title}</h2>

                  <button
                    className="primary-button compact-button goal-add-button"
                    onClick={() =>
                      void handleAddGoal(section.term)
                    }
                  >
                    + Add Goal
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
            <h2 className="section-title">Completed</h2>

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

      <section className="page right-page goals-page distress-f">
        {selectedGoal ? (
          <>
            <div className="goal-editor-heading">
              <div className="goal-heading-row">
                <input
                  className="detail-title goal-title-editor"
                  value={selectedGoal.title}
                  onChange={(event) =>
                    changeSelectedGoal({
                      title: event.target.value,
                    })
                  }
                  placeholder="New Goal"
                />

                <button
                  className="destructive-button goal-delete-button"
                  onClick={() =>
                    setGoalPendingDeletion(
                      selectedGoal
                    )
                  }
                >
                  Delete Goal
                </button>
              </div>

              <p className="subtitle">
                {selectedGoal.status === 'completed'
                  ? 'Completed'
                  : selectedGoal.hasSetback
                    ? 'Active — Setback'
                    : 'Active'}
              </p>
            </div>

            <div className="goal-editor">
              <div className="page-section goal-notes-field">
                <h2 className="section-title">Goal </h2>

                <textarea
                  ref={goalEditorRef}
                  className="writing-textarea"
                  value={selectedGoal.goal}
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
              </div>

              <div className="page-section goal-notes-field">
                <h2 className="section-title">How to Measure</h2>

                <textarea
                  ref={measureEditorRef}
                  className="writing-textarea"
                  value={selectedGoal.howToMeasure}
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
              </div>

              <div className="page-section goal-notes-field">
                <h2 className="section-title">Downside</h2>

                <textarea
                  ref={downsideEditorRef}
                  className="writing-textarea"
                  value={selectedGoal.downside}
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
              </div>

              <div className="goal-bottom-actions">
                <div className="goal-actions">
                  {selectedGoal.status === 'active' ? (
                    <button
                      className="primary-button compact-button goal-complete-button"
                      onClick={() =>
                        void handleComplete()
                      }
                    >
                      Complete Goal
                    </button>
                  ) : (
                    <button
                      className="primary-button compact-button goal-reopen-button"
                      onClick={() =>
                        void handleReopen()
                      }
                    >
                      Reopen Goal
                    </button>
                  )}
                </div>
                <div className="goal-editor-toggles">
                  <label className="goal-setback-toggle">
                    <input
                      type="checkbox"
                      checked={selectedGoal.pinnedToToday}
                      onChange={(event) =>
                        changeSelectedGoal({
                          pinnedToToday:
                            event.target.checked,
                        })
                      }
                    />

                    <span>
                      Pin to Today
                    </span>
                  </label>

                  <label className="goal-setback-toggle">
                    <input
                      type="checkbox"
                      checked={selectedGoal.hasSetback}
                      onChange={(event) =>
                        changeSelectedGoal({
                          hasSetback:
                            event.target.checked,
                        })
                      }
                    />

                    <span>
                      Setback
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="goal-no-selection">
            <h1 className="page-title">Goals</h1>

            <p className="subtitle">
              Add a Short, Mid or Long
              Term goal to get started.
            </p>
          </div>
                )}
      </section>

      {goalPendingDeletion && (
        <ConfirmModal
          title="Delete Goal?"
          message={`Delete "${
            goalPendingDeletion.title ||
            'Untitled Goal'
          }"? This cannot be undone.`}
          confirmLabel="Delete Goal"
          isConfirming={isDeletingGoal}
          onCancel={() =>
            setGoalPendingDeletion(null)
          }
          onConfirm={() =>
            void handleDelete()
          }
        />
      )}
    </>
  )
}