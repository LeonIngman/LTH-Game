## Authoritative References

This document **inherits styling and commit rules** from the development guide:

- **Styling & Tailwind** → see [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md#styling-and-tailwind)
- **Git & Commit Conventions** → see [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md#git-and-commit-conventions)

> The AI agent MUST treat those sections as canonical and avoid redefining them here.

# AI Agent Development Guidelines

**Goal:**  
Streamline how the AI agent tackles assignments in a consistent, maintainable, and test-driven manner.  
These guidelines ensure that changes are implemented cleanly, fully tested, and easy to track in the git history.

---

## Step-by-Step Workflow

### 1. Receive the Assignment

- The AI agent will always begin by **parsing the prompt** and clearly identifying:
  - The **task scope** (e.g., "fix bug number 3 in TODO.md")
  - Any **related files** or components
  - Any **dependencies** or blocked tasks from `TODO.md` or `Bugs` list
- If the task is unclear, **ask for clarification** before proceeding.

---

### 2. Set Up Context

- Pull the latest code from the repository.
- Ensure the correct branch is checked out:
  - If working on a bug or feature, create a branch named in the format:
    ```
    type/scope-short-description
    ```
    Example:
    ```
    fix/bug-3-game-history-null
    feat/auth-error-handling
    ```
- Review related documentation:
  - `DEVELOPMENT_GUIDELINES.md` for coding style, Tailwind usage, and file structure.
  - `TODO.md` and `Bugs` section for current issues and dependencies.

---

> **Note:** Before writing code, re-check the canonical rules in
> [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md#styling-and-tailwind)
> and
> [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md#git-and-commit-conventions).

### 3. Implement Test-Driven Development (TDD)

1. **Write failing tests first**:
   - Tests must cover **all expected behaviors** of the fix or feature.
   - Include both **happy path** and **edge cases**.
   - Ensure tests are **self-contained** and run reliably.
2. Confirm that the tests **fail** before proceeding.
3. Store test files according to project conventions (e.g., `__tests__/` or `tests/`).

---

### 4. Implement the Solution

- Follow **modular design principles**:
  - Split functionality into logical, reusable functions or components.
  - Keep files focused and concise.
- Apply **appropriate error handling**:
  - Prevent application crashes.
  - Provide meaningful error messages to the user.
- Follow **styling conventions** from `DEVELOPMENT_GUIDELINES.md`:
  - Tailwind utility classes should match established patterns.
  - Maintain accessibility (a11y) standards.
- Keep **naming conventions** consistent with the rest of the codebase.

---

### 5. Validate the Solution

- Run the full test suite to confirm all tests pass.
- Do **not** modify the original tests to make them pass unless:
  - There was a mistake in the test itself, and
  - The test correction is documented and approved.

---

### 6. Perform Code Review (Self-Check)

- Review the code for:
  - **Readability**: Would a new developer understand this easily?
  - **Maintainability**: Is the logic reusable or adaptable?
  - **Performance**: Any unnecessary computations or API calls?
- Ensure that all **console logs** or debugging artifacts are removed unless explicitly required.

---

### 7. Make Micro Commits

- Follow the **Conventional Commits** style and `DEVELOPMENT_GUIDELINES.md` conventions:
  - Format:
    ```
    type(scope): short description
    ```
    Examples:
    ```
    fix(game-history): handle null values in order data
    feat(auth): add accessible error banners
    refactor(ui): extract table rendering into separate component
    ```
- Keep commits **atomic**:
  - Each commit should address **only one logical change**.
  - Include a **commit body** listing:
    - Files changed
    - What changed
    - Why the change was necessary

---

### 8. Final Verification

- Ensure no ESLint or TypeScript errors.
- Confirm all automated checks (CI/CD) pass.
- Run a **manual test** of the affected functionality in the UI.
- If the change fixes a bug from `TODO.md`, update the file:
  - Mark the bug as fixed.
  - Move any related TODO items to `Completed Tasks` if appropriate.

---

### 9. Push and Document

- Push the branch to the remote repository.
- Open a pull request with:
  - A clear title matching the main commit message.
  - A description referencing the task or bug number.
  - A summary of changes, tests added, and verification steps.

---

## Additional Best Practices

- **Always clean up the entire source control**: Remove temporary files, debug artifacts, unused imports, and ensure a clean git working directory before committing.
- **Ask before assuming**: If unsure about requirements, get confirmation.
- **Document as you go**: Update or create related markdown files (e.g., `docs/`) with relevant information.
- **Keep performance in mind**: Optimize where reasonable without overcomplicating the code.
- **Maintain accessibility**: Follow WCAG guidelines for UI changes.

---

Following these guidelines ensures:

- Predictable and maintainable contributions.
- Reliable test coverage.
- A clear and traceable git history.
- Alignment with project structure and coding standards.
