# BlockQuest MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an installable, local-first iPad daily task and reward application.

**Architecture:** A pure `gameState` module manages serialized local data and is tested independently. React components consume this state and render three navigation views. The PWA build caches the app shell for offline use.

**Tech Stack:** React, TypeScript, Vite, Vitest, vite-plugin-pwa, CSS.

---

### Task 1: Bootstrap and test the game-state contract

**Files:** `package.json`, `src/lib/gameState.test.ts`, `src/lib/gameState.ts`

- [ ] Add a failing test for completing a task, earning its emerald/XP values and refusing a second completion.
- [ ] Implement default data, immutable state transitions, date normalization and localStorage save/load until the test passes.

### Task 2: Implement reward, streak and reset state transitions

**Files:** `src/lib/gameState.test.ts`, `src/lib/gameState.ts`

- [ ] Add failing tests for redemption affordability, all-complete bonus and resetting default data.
- [ ] Implement the minimum transitions and run the full test suite.

### Task 3: Build the responsive adventure interface

**Files:** `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/types.ts`

- [ ] Render today, reward and parent-management views with large touch controls.
- [ ] Connect actions to state transitions and persist after each action.

### Task 4: Make the application installable and verify

**Files:** `vite.config.ts`, `public/*`, `index.html`

- [ ] Configure manifest, icons and service worker for standalone iPad use.
- [ ] Run tests, type checking, production build and start the dev server.
