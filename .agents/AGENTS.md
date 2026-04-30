# Agent Instructions

These instructions apply to this project and should be followed by every agent working here.

## Session Context

- At the start of every new session, read `.agents/plans/PROGRESS_TRACKER.md` first to understand where the project left off.
- Then read the relevant planning files in `.agents/plans` for the task at hand.
- Update `.agents/plans/PROGRESS_TRACKER.md` after every major task completion, phase completion, architecture decision, dependency change, or blocker.
- Keep tracker updates short, concrete, and useful for the next agent.

## Development Workflow

- Read the existing files and project structure before making changes.
- Prefer the conventions already used in this project over introducing new patterns.
- Keep changes focused on the requested task. Do not refactor unrelated code unless it is required.
- Protect user work. Do not delete, overwrite, or revert changes unless the user clearly asks for it.
- When editing, make the smallest complete change that solves the problem.

## Dev Server

- Do not start, restart, or stop the development server unless the user explicitly asks.
- Assume the user will run the dev server manually while the project is being built.
- If a running server is needed for verification, tell the user what to run instead of launching it yourself.
- Do not occupy ports with background dev-server processes.

## Checks Before Finishing

- Run relevant checks after code changes whenever the project provides them.
- Check available scripts first, usually in `package.json`, before choosing commands.
- Prefer project scripts such as:
  - `pnpm lint`
  - `pnpm format`
  - `pnpm format:check`
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`
- Only run checks that make sense for the files changed.
- If a check cannot be run because dependencies are missing, scripts do not exist, or the environment blocks it, mention that clearly in the final response.

## Formatting

- Use Prettier for code formatting.
- Prefer a project script such as `pnpm format` to format changed files.
- Prefer `pnpm format:check` when only checking formatting before finishing.
- Do not manually fight Prettier output. Let the configured formatter decide whitespace, wrapping, quotes, and semicolons.

## Quality Bar

- Fix lint, type, formatting, and obvious runtime errors caused by the change.
- Do not leave broken imports, unused variables, dead code, or placeholder logic.
- Keep UI responsive on mobile and desktop when touching frontend code.
- Match the design direction in `.agents/DESIGN.md` when building or changing visual UI.
- Use accessible labels, semantic HTML, keyboard-friendly controls, and readable contrast for user-facing UI.

## Final Response

- Summarize what changed.
- Mention which checks were run and whether they passed.
- Mention any checks that were skipped or unavailable.
- Keep the response short and practical.
