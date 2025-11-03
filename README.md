# Asana to Gitea Migrator

> A modern TypeScript migration tool to seamlessly import Asana projects into self-hosted Gitea repositories.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-orange.svg)](https://bun.sh)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

## ✨ Features

- 🚀 **Fast & Efficient** - Built with Bun for blazing-fast TypeScript execution
- 📦 **Complete Migration** - Transfers projects, tasks, sections, and metadata
- 🏷️ **Smart Label System** - Converts Asana sections into Gitea labels
- 👥 **User Mapping** - Configurable assignee mapping between platforms
- ⏰ **Rate Limiting** - Built-in API throttling to respect Gitea's limits
- ✅ **Type-Safe** - Full TypeScript implementation with strict type checking
- 🧪 **Well Tested** - Comprehensive unit test coverage
- 🎨 **Code Quality** - ESLint + Prettier for consistent, clean code

## 📋 What Gets Migrated

For each Asana JSON export file, this tool creates:

- ✓ Issues for each task with full descriptions
- ✓ Labels for Asana sections (e.g., "In Progress", "Done") for easy filtering
- ✓ Task assignees (mapped to Gitea users)
- ✓ Due dates
- ✓ Completion status (open/closed)
- ✓ Original metadata preserved in issue descriptions

**Note on Project Boards**: Gitea 1.24.6 does not have API support for project boards (planned for Gitea 1.26.0). Issues are tagged with section labels, allowing you to:
1. Filter issues by section label in Gitea
2. Manually create project boards in the Gitea web UI
3. Bulk-assign filtered issues to your project boards

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- Gitea instance with API access
- Gitea API token with repository write permissions
- Asana project exports in JSON format

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lilaflo/asana-to-gitea
   cd asana-to-gitea
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Prepare your exports**

   Place your Asana JSON export files in the `exports/` directory:
   ```bash
   mkdir -p exports
   # Copy your Asana export files here
   ```

4. **Configure environment**

   Create a `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set your configuration:
   ```env
   GITEA_TOKEN=your-gitea-api-token
   GITEA_URL=https://git.example.com
   GITEA_OWNER=your-org
   GITEA_REPO=your-repo
   ```

   Bun automatically loads `.env` files - no additional setup needed!

### Configuration

The tool uses environment variables for configuration (via `.env` file):

- **GITEA_TOKEN**: Your Gitea API token (required)
- **GITEA_URL**: Your Gitea instance URL (defaults to `https://git.example.com`)
- **GITEA_OWNER**: Repository owner/organization (defaults to `your-org`)
- **GITEA_REPO**: Repository name (defaults to `your-repo`)

**User Mappings**: Create `usermapping.json` from the example template:

```bash
cp usermapping.example.json usermapping.json
```

Then edit `usermapping.json` to map your team's Asana emails to Gitea usernames:

```json
[
  {
    "asanaEmail": "user@asana.com",
    "giteaUsername": "user123"
  },
  {
    "asanaEmail": "another@asana.com",
    "giteaUsername": "another456"
  }
]
```

**Important**: Use Gitea **usernames** (login names), not email addresses. You can find usernames in your Gitea user profile or collaborators list.

### Running the Migration

Execute the migration:
```bash
bun start
```

The tool will:
1. Load migration state from previous runs (if any)
2. Scan the `exports/` directory for JSON files
3. Check for existing issues in Gitea to prevent duplicates
4. Create section labels and issues in Gitea
5. Track migrated tasks in `migration-state.json`
6. Display progress and summary statistics (created, skipped, failed)

**Re-running the Migration**: It's safe to re-run the migration multiple times. The tool will:
- Skip tasks that have already been migrated (tracked in `migration-state.json`)
- Detect existing issues by parsing Asana IDs from issue bodies
- Only create issues for new or failed tasks
- Show a count of skipped tasks in the summary

### Post-Migration: Organizing with Project Boards

After migration, organize your issues using Gitea's project boards:

1. **Create a Project Board**:
   - Go to your repository in Gitea
   - Navigate to **Projects** tab
   - Click **New Project** and name it after your Asana project

2. **Filter and Assign Issues**:
   - Go to **Issues** tab
   - Use the label filter to show issues from a specific section (e.g., "In Progress")
   - Select multiple issues using checkboxes
   - Use the bulk actions menu to assign them to your project board

3. **Organize Columns**:
   - In your project board, create columns matching your workflow
   - Drag and drop issues between columns as needed

This two-step approach (automated migration + manual organization) works around Gitea 1.24.6's API limitations while preserving all task metadata.

## 🛠️ Development

### Available Commands

| Command | Description |
|---------|-------------|
| `bun start` | Run the migration |
| `bun dev` | Run with auto-reload on file changes |
| `bun test` | Execute unit tests |
| `bun run type-check` | Run TypeScript type checking |
| `bun run lint` | Check code with ESLint |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run format` | Format code with Prettier |
| `bun run format:check` | Verify code formatting |

### Running All Quality Checks

Before committing changes:
```bash
bun run lint && bun run format:check && bun test && bun run type-check
```

## 📁 Project Structure

```
asana-to-gitea/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration loader
│   ├── migrator.ts           # Core migration logic
│   ├── gitea/
│   │   └── client.ts         # Gitea API client
│   ├── types/
│   │   ├── asana.ts          # Asana schema types
│   │   ├── gitea.ts          # Gitea API types
│   │   └── config.ts         # Config types
│   └── utils/
│       ├── user-mapping.ts   # User mapping utilities
│       ├── task-converter.ts # Task conversion logic
│       └── *.test.ts         # Unit tests
├── exports/                   # Place Asana JSON files here
├── eslint.config.js          # ESLint configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## 📖 How to Export from Asana

Before running the migration, you need to export each Asana project individually:

1. **Navigate to your Asana workspace** and identify all projects you want to migrate
2. **For each project**:
   - Open the project in Asana
   - Click on the project dropdown menu (next to the project name)
   - Select **Export** → **JSON**
   - Save the exported JSON file with a descriptive name (e.g., `backend-tasks.json`, `api-development.json`, `qa-testing.json`)
3. **Move all exported files** to the `exports/` directory in this project
4. **Verify** that each JSON file represents one complete Asana project

**Important Notes:**
- Each JSON file will create one separate Gitea project board
- Use meaningful filenames as they help identify which export corresponds to which project
- You must export projects one at a time - Asana doesn't support bulk export
- Ensure all projects are exported before running the migration tool

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with descriptive messages
4. Run all quality checks
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) - The fast all-in-one JavaScript runtime
- Powered by [TypeScript](https://www.typescriptlang.org/)
- Designed for [Gitea](https://gitea.io/) - A painless self-hosted Git service

## 💡 Tips

- **Dry Run**: Review the console output before the migration completes to ensure everything looks correct
- **Backup**: Always backup your Gitea instance before running migrations
- **Rate Limits**: The tool includes 100ms delays between requests - adjust in `src/migrator.ts:219` if needed
- **Large Projects**: For projects with many tasks, consider running during off-peak hours
- **Section Labels**: Each Asana section becomes a label with a unique color for easy visual identification
- **Project Board Workflow**: After migration, filter issues by label and bulk-assign them to project boards
- **Duplicate Prevention**: The tool tracks migrated tasks in `migration-state.json` - keep this file to avoid duplicates
- **Partial Failures**: If some tasks fail to migrate, simply re-run `bun start` - only failed tasks will be retried
- **State File**: The `migration-state.json` file is automatically gitignored and should not be committed

## 📮 Support

If you encounter issues or have questions:

1. Check the [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation
2. Review existing GitHub Issues
3. Create a new issue with details about your problem

---

**Made with ❤️ for teams transitioning to self-hosted Git solutions**
