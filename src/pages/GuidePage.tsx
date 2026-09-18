import {
  guideTopics,
  type GuideTopicId,
} from '../data/guideTopics'

import { useState } from 'react'

export default function GuidePage() {
  const [
    selectedTopicId,
    setSelectedTopicId,
  ] = useState<GuideTopicId>(
    'getting-started'
  )

  const selectedTopic =
    guideTopics.find(
      (topic) =>
        topic.id === selectedTopicId
    ) ?? guideTopics[0]

  return (
    <>
      <section className="page left-page distress-c guide-page">
        <div className="page-heading-copy">
        <h1 className="page-title">
            Guide
        </h1>

        <p className="page-intro">
            For when memory, instinct,
            and guesswork have all failed.
        </p>
        </div>

        <div className="guide-topic-list">
          {guideTopics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={
                topic.id === selectedTopicId
                    ? 'selection-list-item active'
                    : 'selection-list-item'
                }
              onClick={() =>
                setSelectedTopicId(
                  topic.id
                )
              }
            >
              {topic.title}
            </button>
          ))}
        </div>
      </section>

      <section className="page right-page distress-b guide-detail-page">
        <h2 className="detail-title">
            {selectedTopic.title}
        </h2>

        <div className="page-section">
            <h3 className="section-title">
            Purpose
            </h3>

            <p>
            {selectedTopic.purpose}
            </p>
        </div>

        <div className="page-section">
            <h3 className="section-title">
            How it works
            </h3>

            <ul>
            {selectedTopic.howItWorks.map(
                (item) => (
                <li key={item}>
                    {item}
                </li>
                )
            )}
            </ul>
        </div>
        </section>
    </>
  )
}