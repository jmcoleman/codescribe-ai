#!/bin/bash

# CodeScribe AI Roadmap Update Script
# This script:
# 0. Creates private/roadmap-archives/ directory if it doesn't exist
# 1. Backs up current HTML and JSON files to private/roadmap-archives/
# 2. Copies the latest downloaded ROADMAP-TIMELINE.html to the project directory

DOWNLOADS_DIR="$HOME/Downloads"
PROJECT_DIR="$HOME/Developer/projects/codescribe-ai/docs/planning"
PRIVATE_DIR="$HOME/Developer/projects/codescribe-ai/private"
ARCHIVE_DIR="$PRIVATE_DIR/roadmap-archives"

# Generate timestamp in YYYYMMDD:HH:MM:SS format (24-hour)
TIMESTAMP=$(date +"%Y%m%d:%H:%M:%S")

# Files to backup
HTML_FILE="$PROJECT_DIR/ROADMAP-TIMELINE.html"
JSON_FILE="$PROJECT_DIR/roadmap-data.json"

echo "🕐 Timestamp: $TIMESTAMP"
echo ""

# === STEP 0: Ensure directories exist ===
if [ ! -d "$PRIVATE_DIR" ]; then
    echo "📁 Creating private/ directory..."
    mkdir -p "$PRIVATE_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Created: private/"
    else
        echo "❌ Failed to create private/ directory"
        exit 1
    fi
fi

if [ ! -d "$ARCHIVE_DIR" ]; then
    echo "📁 Creating roadmap-archives/ directory..."
    mkdir -p "$ARCHIVE_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Created: private/roadmap-archives/"
    else
        echo "❌ Failed to create roadmap-archives/ directory"
        exit 1
    fi
fi

if [ ! -d "$PRIVATE_DIR" ] || [ ! -d "$ARCHIVE_DIR" ]; then
    echo ""
fi

# === STEP 1: Backup existing files ===
echo "📦 Creating backups..."

# Backup HTML file if it exists
if [ -f "$HTML_FILE" ]; then
    BACKUP_HTML="$ARCHIVE_DIR/ROADMAP-TIMELINE $TIMESTAMP.html"
    cp "$HTML_FILE" "$BACKUP_HTML"
    if [ $? -eq 0 ]; then
        echo "✅ Backed up: ROADMAP-TIMELINE $TIMESTAMP.html"
    else
        echo "⚠️  Warning: Failed to backup HTML file"
    fi
else
    echo "ℹ️  No existing HTML file to backup"
fi

# Backup JSON file if it exists
if [ -f "$JSON_FILE" ]; then
    BACKUP_JSON="$ARCHIVE_DIR/roadmap-data $TIMESTAMP.json"
    cp "$JSON_FILE" "$BACKUP_JSON"
    if [ $? -eq 0 ]; then
        echo "✅ Backed up: roadmap-data $TIMESTAMP.json"
    else
        echo "⚠️  Warning: Failed to backup JSON file"
    fi
else
    echo "ℹ️  No existing JSON file to backup"
fi

echo ""

# === STEP 2: Copy new HTML file ===
echo "📥 Updating HTML file..."

# Find the most recent ROADMAP-TIMELINE*.html file in Downloads
LATEST_FILE=$(ls -t "$DOWNLOADS_DIR"/ROADMAP-TIMELINE*.html 2>/dev/null | head -1)

if [ -z "$LATEST_FILE" ]; then
    echo "❌ No ROADMAP-TIMELINE.html files found in Downloads"
    echo "💡 Press Shift+S in the browser to save the updated HTML first"
    exit 1
fi

echo "📄 Found: $(basename "$LATEST_FILE")"
echo "📋 Copying to: $PROJECT_DIR/ROADMAP-TIMELINE.html"

# Copy the file
cp "$LATEST_FILE" "$PROJECT_DIR/ROADMAP-TIMELINE.html"

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated ROADMAP-TIMELINE.html"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Refresh your browser with Cmd+Shift+R to see changes"
    echo "   2. Backups saved to: private/roadmap-archives/"
else
    echo "❌ Failed to copy file"
    exit 1
fi
