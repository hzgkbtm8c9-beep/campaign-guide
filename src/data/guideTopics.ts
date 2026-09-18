export type GuideTopicId =
  | 'getting-started'
  | 'today'
  | 'character'
  | 'ferret'
  | 'goals'
  | 'people'
  | 'discoveries'
  | 'journal'
  | 'reminders'
  | 'review'

export type GuideTopic = {
  id: GuideTopicId
  title: string
  purpose: string
  howItWorks: string[]
}

export const guideTopics: GuideTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    purpose:
      'Campaign Guide is your adventuring companion — keeping your character, plans, hurried notes, and hard-earned discoveries together as your campaign unfolds.',
    howItWorks: [
      'Before the adventure, use Character, Goals, and Reminders to keep the things you want to remember between sessions close at hand.',
      'When the dice start rolling, Today is your main dashboard. Start a Session and use Quick Notes to jot things down without slowing the game.',
      'When the Session ends, Session Review takes you through those Quick Notes and lets you decide what is worth remembering.',
      'Completing the Review turns those decisions into your lasting Journal, People, and Discoveries.',
      'Most changes around Campaign Guide save automatically as you make them. Your work in Session Review is also saved while you review, but it does not become part of your campaign records until you complete the Review.',
    ],
  },
  {
    id: 'today',
    title: 'Today',
    purpose:
      'Today is your adventuring dashboard — the things worth having close at hand when the dice start rolling.',
    howItWorks: [
      'Your current Goals appear here automatically, starting with the ones you created first.',
      'Reminders stay in their own section and do not automatically appear on Today.',
      'Start a Session when the adventure begins. This gives you a place to collect Quick Notes as you play.',
      'Quick Notes are meant to be quick. Jot down the important bit now and sort out where it belongs later.',
      'When you end the Session, its Quick Notes are waiting for you in Session Review. Nothing is added to Journal, People, or Discoveries until you complete that Review.',
    ],
  },
  {
    id: 'character',
    title: 'Character',
    purpose:
      'Character is home to your adventurer — abilities, equipment, wealth, experience, and the other details that keep them alive.',
    howItWorks: [
      'Changes to your Character are saved automatically.',
      'Enter your ability scores and their modifiers are worked out for you automatically.',
      'Level, XP, XP to Next Level, and your coins are yours to manage. Campaign Guide will not decide when your character advances or gets richer.',
      'Your equipment and other character details stay with your character between adventures.',
    ],
  },
  {
    id: 'ferret',
    title: 'Companion',
    purpose:
      'Companion is home to the creature sharing your adventures — and, presumably, some of your rations.',
    howItWorks: [
      'Your companion and its information stay with you between adventures.',
      'Keep its details up to date as things change during the campaign.',
      'Abilities can be added, edited, and removed as your companion develops and acquires new tricks.',
    ],
  },
  {
    id: 'goals',
    title: 'Goals',
    purpose:
      'Goals keep track of what your character hopes to accomplish, assuming the adventure does not derail those plans first.',
    howItWorks: [
      'Goals stick around between sessions until you change or remove them.',
      'Today automatically shows the available Goals you created first.',
      'Editing a Goal does not move it ahead of or behind your other Goals — its original place in the order stays the same.',
      'Changes to your Goals are saved automatically.',
    ],
  },
  {
    id: 'people',
    title: 'People',
    purpose:
      'People remembers the friends, foes, suspicious strangers, and everyone else worth remembering.',
    howItWorks: [
      'You can add People yourself, or add new information about them while working through Session Review.',
      'Information added through a completed Review joins the notes already collected for that Person.',
      'Search helps you find someone again when names, places, and suspicious behaviour start piling up.',
      'If the same Person ends up with more than one record, Merge lets you combine them. Their collected notes are kept together in chronological order.',
    ],
  },
  {
    id: 'discoveries',
    title: 'Discoveries',
    purpose:
      'Discoveries keeps the places, objects, clues, lore, and other secrets your adventures uncover.',
    howItWorks: [
      'Discoveries are organized into categories to make the growing pile of campaign knowledge easier to navigate.',
      'You can add Discoveries yourself, or add new information about them while working through Session Review.',
      'Information added through a completed Review joins the notes already collected for that Discovery.',
      'Search helps you dig up that clue you definitely remember finding six sessions ago.',
      'If the same Discovery ends up with more than one record, Merge lets you combine them. Their collected notes are kept together in chronological order.',
    ],
  },
  {
    id: 'journal',
    title: 'Journal',
    purpose:
      'Journal is the story of your campaign so far — one completed adventure at a time.',
    howItWorks: [
      'When you complete a Session Review, everything you chose for the Journal is gathered into that Session’s Journal entry.',
      'Entries stay in Session order, giving you a history of the campaign as it unfolded.',
      'You can edit the title and text of a Journal entry after the Review is finished.',
      'Changes to Journal entries are saved automatically.',
      'Search helps you find old adventures, forgotten details, and that one thing everyone at the table swears happened differently.',
    ],
  },
  {
    id: 'reminders',
    title: 'Reminders',
    purpose:
      'Reminders keeps hold of the little things you would rather not trust to memory.',
    howItWorks: [
      'Reminders stay around between sessions until you change or remove them.',
      'They live in their own section and do not automatically appear on Today.',
      'Changes to Reminders are saved automatically.',
    ],
  },
  {
    id: 'review',
    title: 'Session Review',
    purpose:
      'Session Review is where the hurried notes from the table become the lasting story and knowledge of your campaign.',
    howItWorks: [
      'Review takes you through the Quick Notes from your finished Session one at a time.',
      'For each Quick Note, decide what is worth keeping and where it belongs. The same note can contribute to Journal, People, Discoveries, or more than one of them.',
      'If a Quick Note turned out not to be worth keeping after all, you can discard it instead.',
      'When adding something to People or Discoveries, you can choose an existing record or create a new one.',
      'New People and Discoveries created during Review do not join your campaign records until you complete the Review.',
      'Your Review work is saved as you go, so you can move between Quick Notes and come back to earlier decisions without losing your progress.',
      'Each Quick Note needs a decision before the Review can be completed.',
      'View Summary gives you one last look at the decisions made across the Session before you commit them.',
      'Complete Review finishes the job: your chosen Journal pieces, People notes, and Discoveries become part of the campaign, and the Review closes.',
    ],
  },
]