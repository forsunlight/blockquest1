# BlockQuest MVP Design

## Goal

Build an original pixel-adventure daily habit tracker for a child to use on an iPad in landscape orientation.

## Experience

The child lands in a sky-and-grass world, sees today’s quest cards, and marks each quest complete or skipped with large touch targets. Completing a quest awards emeralds and XP. A status bar, progress meter, treasure chest and adventure path make progress feel like a game rather than an admin tool.

## Pages

- Today: status, progress, quest cards and world scene.
- Rewards: emerald-priced reward cards and redemption feedback.
- Parent: four-digit PIN gate; after unlocking, task/reward create, edit and delete forms plus reset defaults.

## State and persistence

One serializable localStorage state contains settings, task templates, reward templates, profile, daily records and redeemed reward history. The state module resets the active date on access, prevents duplicate completion rewards, awards the all-quests bonus once, and derives the completion streak from finished days.

## Technical design

React + TypeScript + Vite. CSS-only original block-world shapes avoid third-party game assets. vite-plugin-pwa provides the manifest and service worker. Vitest tests the domain state module.

## Error and safety behavior

Malformed localStorage falls back to default data. PIN defaults to `1234` and can be changed by a parent. Reward redemption is disabled when emeralds are insufficient; deleting templates does not corrupt already-recorded daily progress.
