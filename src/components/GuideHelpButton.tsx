import { useState } from 'react'
import GuideHelp from './GuideHelp'
import type { GuideTopicId } from '../data/guideTopics'

export default function GuideHelpButton({
  topicId,
}: {
  topicId: GuideTopicId
}) {
  const [isOpen, setIsOpen] =
    useState(false)

  return (
    <>
      <button
        type="button"
        className="guide-help-button"
        aria-label="Open guide help"
        title="Guide help"
        onClick={() => setIsOpen(true)}
      >
        i
      </button>

      {isOpen && (
        <GuideHelp
          topicId={topicId}
          onClose={() =>
            setIsOpen(false)
          }
        />
      )}
    </>
  )
}