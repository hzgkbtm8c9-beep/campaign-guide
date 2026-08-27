import {
  useEffect,
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
  ])

  async function handleDelete() {
    if (!selectedReminder) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${
          selectedReminder.title ||
          'Untitled Reminder'
        }"?`
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteReminder(
        selectedReminder.id
      )

      const remaining =
        reminders.filter(
          (reminder) =>
            reminder.id !==
            selectedReminder.id
        )

      setReminders(
        remaining
      )

      setSelectedReminderId(
        remaining[0]?.id
      )
    } catch (error) {
      console.error(
        'Could not delete Reminder.',
        error
      )
    }
  }

  if (isLoading) {
    return (
      <>
        <section className="page left-page">
          <h1>Reminders</h1>

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
        <div className="reminders-heading">
          <div>
            <h1>Reminders</h1>

            <p className="subtitle">
              Useful things to keep close
            </p>
          </div>

          <span className="reminder-save-status">
            {saveStatus ===
            'saving'
              ? 'Saving…'
              : saveStatus ===
                  'error'
                ? 'Save error'
                : 'Saved'}
          </span>
        </div>

        <button
          className="reminder-add-button"
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
                <label className="reminder-title-field">
                    <span>Title</span>

                    <input
                    value={selectedReminder.title}
                    onChange={(event) =>
                        changeSelectedReminder({
                        title: event.target.value,
                        })
                    }
                    placeholder="Reminder title"
                    />
                </label>
                </div>

                <div className="reminder-editor">
                  <label className="character-field reminder-summary-field">
                    <span>
                      Today Summary
                    </span>

                    <input
                      value={
                        selectedReminder.todaySummary
                      }
                      onChange={(event) =>
                        changeSelectedReminder({
                          todaySummary:
                            event.target.value,
                        })
                      }
                      placeholder="Short phrase shown on Today"
                    />
                  </label>

                  <label className="character-field reminder-content-field">
                    <span>
                      Notes
                    </span>

                    <textarea
                      value={
                        selectedReminder.content
                      }
                      onChange={(event) =>
                        changeSelectedReminder(
                          {
                            content:
                              event.target.value,
                          }
                        )
                      }
                      placeholder="Write the full reminder details here…"
                    />
                  </label>

              <button
                className="reminder-delete-button"
                onClick={() =>
                  void handleDelete()
                }
              >
                Delete Reminder
              </button>
            </div>
          </>
        ) : (
          <div>
            <h1>Reminders</h1>

            <p className="subtitle">
              Add a Reminder to get started.
            </p>
          </div>
        )}
      </section>
    </>
  )
}