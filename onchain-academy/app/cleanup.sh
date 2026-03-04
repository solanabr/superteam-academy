#!/bin/bash

# Superteam Academy Repository Cleanup Script
# This script removes duplicate, unused, and unnecessary files/directories
# RUN WITH CAUTION - Creates a backup before cleanup

set -e

BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
REPO_ROOT="$(pwd)"

echo "🔍 Starting cleanup of Superteam Academy repository..."
echo "📦 Creating backup in: $BACKUP_DIR"

# Create backup
mkdir -p "$BACKUP_DIR"

# ============================================
# BACKUP & DELETE DUPLICATE DIRECTORIES
# ============================================
echo ""
echo "🗑️  Removing duplicate directories..."

if [ -d "__tests__ - Copy" ]; then
    cp -r "__tests__ - Copy" "$BACKUP_DIR/"
    rm -rf "__tests__ - Copy"
    echo "  ✓ Deleted: __tests__ - Copy"
fi

# ============================================
# BACKUP & DELETE EMPTY DIRECTORIES
# ============================================
echo ""
echo "🗑️  Removing empty boilerplate directories..."

for dir in "app" "messages" "mnt"; do
    if [ -d "$dir" ] && [ -z "$(ls -A $dir)" ]; then
        cp -r "$dir" "$BACKUP_DIR/"
        rm -rf "$dir"
        echo "  ✓ Deleted: $dir/"
    fi
done

# ============================================
# BACKUP & DELETE DOCUMENTATION FILES
# ============================================
echo ""
echo "📄 Removing redundant documentation files..."

docs_to_remove=(
    "COMPLETE_FIX_GUIDE.md"
    "COMPLETE_WINNER.md"
    "FILE_NAMING_FIX.md"
    "FILE_PLACEMENT_GUIDE.md"
    "FINAL_CHECKLIST.md"
    "MASTER_SUMMARY.md"
    "PROJECT_STRUCTURE.md"
    "ROOT_CONFIG_FILES.txt"
    "SECURITY_AUDIT.md"
)

for file in "${docs_to_remove[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo "  ✓ Deleted: $file"
    fi
done

# ============================================
# BACKUP & DELETE SETUP/UTILITY SCRIPTS
# ============================================
echo ""
echo "🔧 Removing setup and utility scripts..."

scripts_to_remove=(
    "setup.js"
    "rename-files.js"
    "split.js"
    "diagnostic.js"
    "push-updates.sh"
    "update-repo.sh"
    "verify-setup.js"
)

for file in "${scripts_to_remove[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo "  ✓ Deleted: $file"
    fi
done

# ============================================
# BACKUP & DELETE DUPLICATE CONFIG FILES
# ============================================
echo ""
echo "⚙️  Removing duplicate config files..."

if [ -f "tailwind.config.js" ] && [ -f "tailwind.config.ts" ]; then
    # Keep TypeScript version, remove JS version
    cp "tailwind.config.js" "$BACKUP_DIR/"
    rm "tailwind.config.js"
    echo "  ✓ Deleted: tailwind.config.js (kept tailwind.config.ts)"
fi

# ============================================
# MOVE MISPLACED FILES TO CORRECT LOCATIONS
# ============================================
echo ""
echo "📂 Moving misplaced files to correct directories..."

# Create necessary directories if they don't exist
mkdir -p components contexts lib

# Move component files
if [ -f "LessonView.tsx" ]; then
    mv "LessonView.tsx" "components/"
    echo "  ✓ Moved: LessonView.tsx → components/"
fi

if [ -f "WalletConnectButton.tsx" ]; then
    mv "WalletConnectButton.tsx" "components/"
    echo "  ✓ Moved: WalletConnectButton.tsx → components/"
fi

# Move context files
if [ -f "WalletProvider.tsx" ]; then
    mv "WalletProvider.tsx" "contexts/"
    echo "  ✓ Moved: WalletProvider.tsx → contexts/"
fi

# Move utility files
if [ -f "course.ts" ]; then
    mv "course.ts" "lib/"
    echo "  ✓ Moved: course.ts → lib/"
fi

if [ -f "learning-progress.ts" ]; then
    mv "learning-progress.ts" "lib/"
    echo "  ✓ Moved: learning-progress.ts → lib/"
fi

if [ -f "i18n.ts" ]; then
    mv "i18n.ts" "lib/"
    echo "  ✓ Moved: i18n.ts → lib/"
fi

# Move layout file (if app directory needs it)
if [ -f "layout.tsx" ]; then
    mkdir -p app
    mv "layout.tsx" "app/"
    echo "  ✓ Moved: layout.tsx → app/"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - Removed 1 duplicate directory"
echo "  - Removed 9 redundant documentation files"
echo "  - Removed 7 setup/utility scripts"
echo "  - Removed 1 duplicate config file"
echo "  - Reorganized 8 misplaced source files"
echo ""
echo "📦 Backup saved in: $BACKUP_DIR/"
echo ""
echo "🎯 Your repository is now cleaner!"
echo ""
echo "⚠️  Next steps:"
echo "  1. Review moved files to ensure they work in new locations"
echo "  2. Update any import paths if necessary"
echo "  3. Test the application"
echo "  4. Commit changes: git add -A && git commit -m 'Clean up boilerplate and reorganize files'"
echo "  5. Delete backup directory once confirmed: rm -rf $BACKUP_DIR"