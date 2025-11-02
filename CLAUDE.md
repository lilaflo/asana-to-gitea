# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Asana-to-Gitea migration tool for importing Asana project exports into a self-hosted Gitea repository. It helps teams transition from Asana to self-hosted Gitea while preserving all project data.

## Key Configuration

Configuration is managed through environment variables and `src/config.ts`:

- **Target Repository**: Set via `GITEA_URL`, `GITEA_OWNER`, and `GITEA_REPO` environment variables
- **Authentication**: Use the `$GITEA_TOKEN` environment variable for API access
- **User Mapping**: Customize in `src/utils/user-mapping.ts` to map your team's Asana emails to Gitea emails

## Data Structure

### Asana Export Files
All Asana exports should be placed in the `exports/` directory as individual JSON files. Each file represents one Asana project that will be migrated to Gitea.

### Asana JSON Schema
Each export file contains a `data` array with task objects. Key fields:
- `gid`: Asana task ID
- `name`: Task title
- `notes`: Task description
- `completed`: Boolean completion status
- `completed_at`: Completion timestamp
- `assignee`: User object with `gid` and `name`
- `due_on` / `due_at`: Due dates
- `created_at` / `modified_at`: Timestamps
- `memberships`: Array containing project and section information
- `subtasks`: Array of subtask references
- `tags`: Array of tags
- `followers`: Array of user objects

## Runtime & Package Manager

This project uses **Bun** as the JavaScript runtime and package manager. Bun is a fast all-in-one JavaScript runtime with native TypeScript support.

## Development Commands

- **Run migration**: `bun start` - Executes the migration script
- **Run in dev mode**: `bun dev` - Runs with auto-reload on file changes
- **Run tests**: `bun test` - Executes all unit tests
- **Type check**: `bun run type-check` - Validates TypeScript without emitting files
- **Lint**: `bun run lint` - Checks code with ESLint
- **Lint fix**: `bun run lint:fix` - Auto-fixes linting issues
- **Format**: `bun run format` - Formats code with Prettier
- **Format check**: `bun run format:check` - Checks code formatting

## Project Structure

```
src/
├── index.ts                 # Main entry point
├── config.ts                # Configuration loader
├── migrator.ts              # Core migration logic
├── types/
│   ├── asana.ts             # Asana export schema types
│   ├── gitea.ts             # Gitea API types
│   └── config.ts            # Configuration types
├── gitea/
│   └── client.ts            # Gitea API client
└── utils/
    ├── user-mapping.ts      # User mapping utilities
    ├── task-converter.ts    # Task to issue conversion logic
    └── *.test.ts            # Unit tests
```

## Architecture

### Migration Flow
1. **Load Configuration** - Reads `GITEA_TOKEN` from environment and sets up repository target
2. **Scan Exports** - Finds all JSON files in `exports/` directory
3. **For Each Export**:
   - Parse Asana tasks from JSON
   - Create Gitea project board with the project name
   - Group tasks by section (Asana sections become Gitea labels)
   - Convert each task to a Gitea issue with:
     - Original task metadata preserved in issue body
     - Assignees mapped via user mapping table
     - Completion status as open/closed state
     - Due dates preserved
     - Section as label
4. **Rate Limiting** - 100ms delay between issue creation to avoid API throttling

### User Mapping
The `user-mapping.ts` utility maps Asana user names to Gitea emails. Mapping is done by matching substrings of the Asana user's name against the email prefix in the mapping table.

### Task Conversion
The `task-converter.ts` utility converts Asana tasks to Gitea issues:
- Task name → Issue title
- Task notes → Issue body (with metadata appended)
- Task completed → Issue state (closed/open)
- Task assignee → Issue assignee (via user mapping)
- Task section → Issue label
- Task due dates → Issue due date

## Code Quality Tools

### Linting (ESLint)
- **Config**: `eslint.config.js` using flat config format (ESLint 9+)
- **Parser**: `@typescript-eslint/parser` for TypeScript support
- **Plugins**: TypeScript ESLint and Prettier integration
- **Rules**: Strict TypeScript rules with Prettier formatting enforcement

### Formatting (Prettier)
- **Config**: `.prettierrc` with project-specific formatting rules
- **Integration**: Runs automatically via ESLint for consistency
- **Settings**: 100-char line width, 2-space tabs, semicolons, double quotes

### Before Committing
Run all quality checks to ensure code meets standards:
```bash
bun run lint && bun run format:check && bun test && bun run type-check
```

## Migration Requirements

1. **One-to-One Mapping**: Each JSON file in `exports/` should create one Gitea project
2. **Task Import**: All tasks from each Asana project must be imported as Gitea issues
3. **User Mapping**: Apply the user mapping when setting assignees
4. **Preserve Metadata**: Maintain completion status, due dates, descriptions, and other task metadata where Gitea supports it
