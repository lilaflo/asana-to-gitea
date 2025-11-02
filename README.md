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

- ✓ A Gitea project board with the original project name
- ✓ Issues for each task with full descriptions
- ✓ Labels for Asana sections (e.g., "In Progress", "Done")
- ✓ Task assignees (mapped to Gitea users)
- ✓ Due dates
- ✓ Completion status (open/closed)
- ✓ Original metadata preserved in issue descriptions

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

   Set your Gitea API token:
   ```bash
   export GITEA_TOKEN="your-gitea-api-token"
   ```

### Configuration

Edit `src/config.ts` to customize:

- **Gitea URL**: Your Gitea instance URL
- **Repository**: Target owner and repository name
- **User Mappings**: Map Asana user emails to Gitea usernames

```typescript
// Example configuration in src/config.ts
return {
  giteaUrl: "https://git.example.com",
  giteaToken,
  repoOwner: "your-org",
  repoName: "your-repo",
  userMappings: [
    { asanaEmail: "user@asana.com", giteaEmail: "user@gitea.com" },
  ],
  exportsDir: path.join(process.cwd(), "exports"),
};
```

### Running the Migration

Execute the migration:
```bash
bun start
```

The tool will:
1. Scan the `exports/` directory for JSON files
2. Create project boards and issues in Gitea
3. Display progress and summary statistics

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
- **Rate Limits**: The tool includes 100ms delays between requests - adjust in `src/migrator.ts` if needed
- **Large Projects**: For projects with many tasks, consider running during off-peak hours

## 📮 Support

If you encounter issues or have questions:

1. Check the [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation
2. Review existing GitHub Issues
3. Create a new issue with details about your problem

---

**Made with ❤️ for teams transitioning to self-hosted Git solutions**
