import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  addReminder,
  deleteReminder,
  getReminders,
  updateReminder,
} from '../data/repository'

import type {
  Campaign,
  Reminder,
} from '../data/database'

import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'
import { SaveStatus } from '../components/SaveStatus'
import GuideHelpButton from '../components/GuideHelpButton'
import ConfirmModal from '../components/ConfirmModal'

export default function RemindersPage({
  campaign,
}: {
  campaign: Campaign
}) {
  const [
    reminders,
    setReminders,
  ] = useState<Reminder[]>([])

  const [
    selectedReminderId,
    setSelectedReminderId,
  ] = useState<string | undefined>()

  const [
    reminderPendingDeletion,
    setReminderPendingDeletion,
  ] = useState<Reminder | null>(null)

  const [
    isDeletingReminder,
    setIsDeletingReminder,
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

  const reminderNotesRef =
  useRef<HTMLTextAreaElement | null>(
    null
  )

  useEffect(() => {
    async function loadReminders() {
      try {
        const result =
          await getReminders(
            campaign.id
          )

        setReminders(result)

        if (result.length > 0) {
          setSelectedReminderId(
            result[0].id
          )
        }
      } catch (error) {
        console.error(
          'Could not load Reminders.',
          error
        )

        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadReminders()
  }, [campaign.id])

  const selectedReminder =
    reminders.find(
      (reminder) =>
        reminder.id ===
        selectedReminderId
    )

    useAutoGrowTextarea(
      reminderNotesRef,
      selectedReminder?.content ?? ''
    )

  async function handleAddReminder() {
    try {
      const reminder =
        await addReminder(
          campaign.id
        )

      setReminders(
        (current) => [
          ...current,
          reminder,
        ]
      )

      setSelectedReminderId(
        reminder.id
      )
    } catch (error) {
      console.error(
        'Could not add Reminder.',
        error
      )

      setSaveStatus('error')
    }
  }

  function changeSelectedReminder(
    changes: Partial<Reminder>
  ) {
    if (!selectedReminder) {
      return
    }

    setReminders(
      (current) =>
        current.map(
          (reminder) =>
            reminder.id ===
            selectedReminder.id
              ? {
                  ...reminder,
                  ...changes,
                }
              : reminder
        )
    )
  }

  useEffect(() => {
    if (!selectedReminder) {
      return
    }

    setSaveStatus('saving')

    const timer =
      window.setTimeout(
        async () => {
          try {
            await updateReminder(
              selectedReminder.id,
              {
                title:
                  selectedReminder.title,
                todaySummary:
                  selectedReminder.todaySummary,
                content:
                  selectedReminder.content,
                pinnedToToday:
                  selectedReminder.pinnedToToday,
              }
            )

            setSaveStatus(
              'saved'
            )
          } catch (error) {
            console.error(
              'Could not save Reminder.',
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
    selectedReminder?.id,
    selectedReminder?.title,
    selectedReminder?.todaySummary,
    selectedReminder?.content,
    selectedReminder?.pinnedToToday,
  ])

  async function handleDelete() {
    if (
      !reminderPendingDeletion ||
      isDeletingReminder
    ) {
      return
    }

    const reminderToDelete =
      reminderPendingDeletion

    try {
      setIsDeletingReminder(true)

      await deleteReminder(
        reminderToDelete.id
      )

      const remaining =
        reminders.filter(
          (reminder) =>
            reminder.id !==
            reminderToDelete.id
        )

      setReminders(remaining)

      if (
        selectedReminderId ===
        reminderToDelete.id
      ) {
        setSelectedReminderId(
          remaining[0]?.id
        )
      }

      setReminderPendingDeletion(null)
    } catch (error) {
      console.error(
        'Could not delete Reminder.',
        error
      )
    } finally {
      setIsDeletingReminder(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1 className="page-title">Reminders</h1>

          <p className="subtitle">
            Loading Reminders…
          </p>
        </section>

        <section className="page right-page" />
      </>
    )
  }

  return (
    <>
      <section className="page left-page reminders-page distress-b">
        <div className="page-heading-with-status">
          <div className="page-heading-copy">
            <h1 className="page-title">
              Reminders
            </h1>

            <p className="page-intro">
              Loose ends worth remembering
              before they come back to bite.
            </p>
          </div>

                    <div className="page-heading-actions">
            <SaveStatus
              status={saveStatus}
              className="reminder-save-status"
            />

            <GuideHelpButton topicId="reminders" />
          </div>
        </div>

        <button
          className="primary-button compact-button reminder-add-button"
          onClick={() =>
            void handleAddReminder()
          }
        >
          + Add Reminder
        </button>

        {reminders.length === 0 ? (
          <p className="empty-message">
            No Reminders yet.
          </p>
        ) : (
          <div className="reminder-list">
            {reminders.map(
              (reminder) => (
                <button
                  key={reminder.id}
                  className={
                    reminder.id ===
                    selectedReminderId
                      ? 'reminder-list-item active'
                      : 'reminder-list-item'
                  }
                  onClick={() =>
                    setSelectedReminderId(
                      reminder.id
                    )
                  }
                >
                  {reminder.title ||
                    'Untitled Reminder'}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className="page right-page reminders-page distress-d">
        {selectedReminder ? (
          <>
            <div className="reminder-editor-heading">
              <div className="reminder-heading-row">
                <input
                  className="detail-title reminder-title-editor"
                  value={selectedReminder.title}
                  onChange={(event) =>
                    changeSelectedReminder({
                      title: event.target.value,
                    })
                  }
                  placeholder="Reminder title"
                />

                <button
                  className="destructive-button reminder-delete-button"
                  onClick={() =>
                    setReminderPendingDeletion(
                      selectedReminder
                    )
                  }
                >
                  Delete Reminder
                </button>
              </div>
            </div>

                <div className="reminder-editor">
                  <div className="page-section reminder-summary-field">
                    <div className="reminder-summary-heading">
                      <h2 className="section-title">
                        Today Summary
                      </h2>

                      <label className="reminder-pin-toggle">
                        <input
                          type="checkbox"
                          checked={
                            selectedReminder.pinnedToToday
                          }
                          onChange={(event) =>
                            changeSelectedReminder({
                              pinnedToToday:
                                event.target.checked,
                            })
                          }
                        />

                        <span>
                          Pin to Today
                        </span>
                      </label>
                    </div>

                    <input
                      value={selectedReminder.todaySummary}
                      onChange={(event) =>
                        changeSelectedReminder({
                          todaySummary: event.target.value,
                        })
                      }
                      placeholder="Short phrase shown on Today"
                    />
                  </div>
                  
                  <div className="page-section reminder-content-field">
                    <h2 className="section-title">Notes</h2>

                    <textarea
                      ref={reminderNotesRef}
                      className="writing-textarea"
                      value={selectedReminder.content}
                      onChange={(event) =>
                        changeSelectedReminder({
                          content: event.target.value,
                        })
                      }
                      placeholder="Write the full reminder details here…"
                    />
                  </div>
            </div>
          </>
        ) : (
          <div>
            <h1 className="page-title">Reminders</h1>

            <p className="subtitle">
              Add a Reminder to get started.
            </p>
          </div>
                )}
      </section>

      {reminderPendingDeletion && (
        <ConfirmModal
          title="Delete Reminder?"
          message={`Delete "${
            reminderPendingDeletion.title ||
            'Untitled Reminder'
          }"? This cannot be undone.`}
          confirmLabel="Delete Reminder"
          isConfirming={isDeletingReminder}
          onCancel={() =>
            setReminderPendingDeletion(null)
          }
          onConfirm={() =>
            void handleDelete()
          }
        />
      )}
    </>
  )
}