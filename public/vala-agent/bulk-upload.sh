#!/bin/bash

# =============================================================================
# SaaSVala Simple Bulk Uploader v2.0
# Usage: ./bulk-upload.sh
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         SAASVALA BULK GITHUB UPLOADER v2.0                ║"
echo "║         Simple. Fast. Reliable.                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}GitHub Token paste karo (ghp_... wala):${NC}"
    read -s TOKEN
    echo ""
else
    TOKEN="$GITHUB_TOKEN"
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Token nahi diya! Exit.${NC}"
    exit 1
fi

# Validate token
echo -e "${BLUE}Token check ho raha hai...${NC}"
USER_CHECK=$(curl -s -H "Authorization: token $TOKEN" "https://api.github.com/user" | grep -o '"login":"[^"]*"' | head -1)
if [ -z "$USER_CHECK" ]; then
    echo -e "${RED}Token galat hai! Naya token banao.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Token sahi hai!${NC}"
echo ""

# Count folders
TOTAL=$(find . -maxdepth 1 -type d ! -name "." ! -name ".git" | wc -l)
echo -e "${BLUE}Total folders: $TOTAL${NC}"
echo ""

# Counters
SUCCESS=0
FAIL=0
CURRENT=0

# Log file
LOG="upload_$(date +%Y%m%d_%H%M%S).log"
echo "Upload started: $(date)" > "$LOG"

# Process each folder
for DIR in */; do
    [ ! -d "$DIR" ] && continue
    
    FOLDER="${DIR%/}"
    ((CURRENT++))
    
    # Clean repo name
    REPO=$(echo "$FOLDER" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    echo -e "${BLUE}[$CURRENT/$TOTAL]${NC} $FOLDER → $REPO"
    
    # Create repo (ignore if exists)
    curl -s -X POST \
        -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/user/repos" \
        -d "{\"name\":\"$REPO\",\"private\":false}" > /dev/null 2>&1
    
    # Enter folder
    cd "$FOLDER" || continue
    
    # Git setup
    [ ! -d ".git" ] && git init -q 2>/dev/null
    git remote remove origin 2>/dev/null
    git remote add origin "https://$TOKEN@github.com/SaaSVala/$REPO.git" 2>/dev/null
    
    # Commit
    git add -A 2>/dev/null
    git commit -q -m "Auto upload via SaaSVala" 2>/dev/null
    
    # Push
    git branch -M main 2>/dev/null
    if git push -u origin main --force -q 2>/dev/null; then
        echo -e "${GREEN}  ✓ Done${NC}"
        echo "SUCCESS: $FOLDER → $REPO" >> "../$LOG"
        ((SUCCESS++))
    else
        echo -e "${RED}  ✗ Failed${NC}"
        echo "FAILED: $FOLDER" >> "../$LOG"
        ((FAIL++))
    fi
    
    cd ..
    sleep 1
done

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Success: $SUCCESS${NC}"
echo -e "${RED}✗ Failed:  $FAIL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Log: ${YELLOW}$LOG${NC}"
echo -e "Repos: ${GREEN}https://github.com/SaaSVala?tab=repositories${NC}"
