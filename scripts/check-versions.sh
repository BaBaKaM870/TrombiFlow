set -e

echo "Checking for non-pinned versions in Python dependencies..."

if grep -E '^[a-zA-Z].*[^=]$' backend/requirements.txt | grep -v '^#' | grep -v '^$' | grep -v '==' | grep -v '@'; then
    echo "❌ Found non-pinned Python dependencies!"
    exit 1
else
    echo "✅ All Python dependencies are pinned in requirements.txt"
fi

echo ""
echo "Checking for caret (^) or tilde (~) in package.json files..."

for file in backend/package.json frontend/package.json; do
    if [ -f "$file" ]; then
        if grep -E '"[^"]+": "[~^]' "$file"; then
            echo "❌ Found non-pinned versions in $file!"
            exit 1
        else
            echo "All versions in $file are pinned (no ^ or ~ used)"
        fi
    fi
done

echo ""
echo "All dependency versions are properly pinned!"
exit 0
