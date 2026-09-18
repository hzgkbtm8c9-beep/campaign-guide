import Modal from './Modal'
import {
  guideTopics,
  type GuideTopicId,
} from '../data/guideTopics'

export default function GuideHelp({
  topicId,
  onClose,
}: {
  topicId: GuideTopicId
  onClose: () => void
}) {
  const topic =
    guideTopics.find(
      (item) => item.id === topicId
    ) ?? guideTopics[0]

  return (
    <Modal onClose={onClose}>
      <h2
        id="guide-help-title"
        className="modal-title"
      >
        {topic.title}
      </h2>

            <div className="page-section">
        <h3 className="section-title">
          Purpose
        </h3>

        <p>{topic.purpose}</p>
      </div>

      <div className="page-section">
        <h3 className="section-title">
          How it works
        </h3>

        <ul>
          {topic.howItWorks.map(
            (item) => (
              <li key={item}>
                {item}
              </li>
            )
          )}
        </ul>
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  )
}