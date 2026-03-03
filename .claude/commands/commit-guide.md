# Git Commit & Push Script

Automated script to format code, commit, and push changes with quality checks.

## Usage

```bash
# Make script executable
chmod +x ./commit-and-push.sh

# Run script
./commit-and-push.sh "Your commit message"
```

## What It Does

1. **Format Code**
   - Formats TypeScript/JavaScript with Prettier
   - Fixes ESLint issues where possible

2. **Run Quality Checks**
   - Type checking with TypeScript
   - ESLint validation
   - Build verification

3. **Create Commit**
   - Stages all changes
   - Creates commit with provided message
   - Includes commit timestamp

4. **Push to Remote**
   - Pushes to current branch
   - Sets upstream if needed

## Example

```bash
./commit-and-push.sh "feat: Add course search filtering"
./commit-and-push.sh "fix: Fix hydration mismatch in dashboard"
./commit-and-push.sh "style: Update button component styles"
```

## Git Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: feat, fix, docs, style, refactor, test, chore
- **scope**: Optional, e.g., (courses), (dashboard), (editor)
- **subject**: Short description (50 chars max)
- **body**: Optional detailed explanation
- **footer**: Optional issue references (fixes #123)

## Example Commit Messages

```
feat(courses): Add course search functionality
fix(editor): Fix Monaco editor initialization error
docs: Update README with setup instructions
style(ui): Align button spacing with design system
refactor: Extract course list to separate component
test: Add unit tests for useLearningProgress hook
chore: Update dependencies
```

---

**Note:** GitHub Actions will automatically run tests and linting on all commits to main/develop branches.
