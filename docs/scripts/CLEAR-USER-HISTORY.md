# Clear User History Script

Development utility script to clear all generation history (batches and documents) for a specific user.

## Location

```
server/scripts/clear-user-history.js
```

## Usage

```bash
cd server

# Basic usage - clear ALL history (batches + documents) for a user
node scripts/clear-user-history.js <user_email_or_id>

# Examples
node scripts/clear-user-history.js test@example.com
node scripts/clear-user-history.js 123
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview what would be deleted without actually deleting |
| `--batches` | Only clear batches (keep documents) |
| `--docs` | Only clear documents (keep batches) |
| *(no flag)* | **Clear both batches and documents** (default) |

## Examples

### Preview before deleting (recommended)

```bash
node scripts/clear-user-history.js your@email.com --dry-run
```

Output:
```
🔍 Looking up user...

📋 User found:
   ID:    42
   Email: your@email.com
   Name:  John Doe
   Tier:  pro

📊 Current history:
   Batches:   15
   Documents: 47

🔍 DRY RUN - No changes will be made

🔍 Clearing all history...

📋 Would delete:
   Batches:   15
   Documents: 47

💡 Run without --dry-run to actually delete
```

### Delete all history

```bash
node scripts/clear-user-history.js your@email.com
```

### Delete by user ID

```bash
node scripts/clear-user-history.js 123
```

### Only clear batches (keep individual documents)

```bash
node scripts/clear-user-history.js your@email.com --batches
```

### Only clear documents (keep batch records)

```bash
node scripts/clear-user-history.js your@email.com --docs
```

## What Gets Deleted

| Data | Table | Deletion Type |
|------|-------|---------------|
| Generation Batches | `generation_batches` | Hard delete |
| Generated Documents | `generated_documents` | Hard delete |

## Safety Notes

- **Development only**: This script performs hard deletes and should only be used in development environments
- **Always use `--dry-run` first**: Preview what will be deleted before running the actual deletion
- **No confirmation prompt**: The script does not ask for confirmation (use `--dry-run` to preview)
- **Irreversible**: Deleted data cannot be recovered

## Database Tables Affected

- `generation_batches` - Stores batch metadata (multi-file generations, summaries)
- `generated_documents` - Stores individual generated documentation files

## Related Documentation

- [Generation History Feature](../features/GENERATION-HISTORY-SPEC.md)
- [Database Schema](../database/DB-NAMING-STANDARDS.md)
- [Database Migration Management](../database/DB-MIGRATION-MANAGEMENT.md)
