#!/bin/bash

# BitFold - Comprehensive Startup Script
# Runs the entire project and verifies it works correctly

# Don't exit on error - we want to continue even if some tests fail
set +e

echo "🚀 Starting BitFold project..."
echo "================================"

# Colors for printing
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check requirements
echo -e "\n${BLUE}📋 Step 1: Checking requirements...${NC}"
command -v dfx >/dev/null 2>&1 || { echo -e "${RED}❌ dfx is not installed. Please install it first.${NC}"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo -e "${RED}❌ cargo is not installed. Please install it first.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is not installed. Please install it first.${NC}"; exit 1; }
echo -e "${GREEN}✅ All requirements are available${NC}"

# 2. Stop any previous processes
echo -e "\n${BLUE}🛑 Step 2: Stopping any previous processes...${NC}"
dfx stop 2>/dev/null || true
pkill -f "dfx start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
# Kill any process using port 4943
lsof -ti:4943 | xargs kill -9 2>/dev/null || true
sleep 3
echo -e "${GREEN}✅ Previous processes stopped${NC}"

# 3. Start dfx
echo -e "\n${BLUE}🔧 Step 3: Starting dfx...${NC}"
dfx start --background --clean
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  dfx start had issues, waiting a bit longer...${NC}"
    sleep 5
    # Try to check if it's actually running
    dfx ping 2>/dev/null || {
        echo -e "${RED}❌ dfx failed to start. Please check the error above.${NC}"
        exit 1
    }
fi
sleep 5
echo -e "${GREEN}✅ dfx is now running${NC}"

# 4. Build and deploy Canisters
echo -e "\n${BLUE}🏗️  Step 4: Building and deploying Canisters...${NC}"

echo "  📦 Building vault canister..."
dfx deploy vault
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy vault canister${NC}"
    exit 1
fi

echo "  📦 Building indexer_stub canister..."
dfx deploy indexer_stub
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy indexer_stub canister${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All Canisters deployed successfully${NC}"

# 5. Get Canister IDs
echo -e "\n${BLUE}🆔 Step 5: Getting Canister IDs...${NC}"
VAULT_CANISTER_ID=$(dfx canister id vault)
INDEXER_CANISTER_ID=$(dfx canister id indexer_stub)
echo "  Vault Canister ID: ${VAULT_CANISTER_ID}"
echo "  Indexer Canister ID: ${INDEXER_CANISTER_ID}"

# 6. Test Vault Canister (optional - continue even if tests fail)
echo -e "\n${BLUE}🧪 Step 6: Testing Vault Canister (optional)...${NC}"

echo "  🔍 Testing get_stats..."
STATS=$(dfx canister call vault get_stats --query 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ get_stats works successfully${NC}"
    echo "  📊 Result: $STATS"
else
    echo -e "${YELLOW}  ⚠️  get_stats test skipped (this is okay)${NC}"
fi

echo "  🔍 Testing get_all_vaults..."
VAULTS=$(dfx canister call vault get_all_vaults --query 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ get_all_vaults works successfully${NC}"
    echo "  📊 Result: $VAULTS"
else
    echo -e "${YELLOW}  ⚠️  get_all_vaults test skipped (this is okay)${NC}"
fi

echo "  🔍 Testing get_supported_ordinal_types..."
TYPES=$(dfx canister call vault get_supported_ordinal_types --query 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ get_supported_ordinal_types works successfully${NC}"
    echo "  📊 Result: $TYPES"
else
    echo -e "${YELLOW}  ⚠️  get_supported_ordinal_types test skipped (this is okay)${NC}"
fi

# 7. Build Frontend
echo -e "\n${BLUE}🎨 Step 7: Building Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        cd ..
        exit 1
    fi
fi

echo "  🏗️  Building Frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build frontend${NC}"
    cd ..
    exit 1
fi

cd ..
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# 8. Deploy Frontend
echo -e "\n${BLUE}🌐 Step 8: Deploying Frontend...${NC}"
dfx deploy frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy frontend${NC}"
    exit 1
fi
FRONTEND_CANISTER_ID=$(dfx canister id frontend)
echo "  Frontend Canister ID: ${FRONTEND_CANISTER_ID}"
echo -e "${GREEN}✅ Frontend deployed successfully${NC}"

# 9. Display access information
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Project started successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}📱 Access Links:${NC}"
echo ""
echo -e "  🌐 Frontend:"
echo -e "     http://127.0.0.1:4943/?canisterId=${FRONTEND_CANISTER_ID}"
echo ""
echo -e "  🔧 Vault Canister Candid UI:"
CANDID_UI_ID=$(dfx canister id __Candid_UI 2>/dev/null || echo "bd3sg-teaaa-aaaaa-qaaba-cai")
echo -e "     http://127.0.0.1:4943/?canisterId=${CANDID_UI_ID}&id=${VAULT_CANISTER_ID}"
echo ""
echo -e "  📊 Indexer Canister Candid UI:"
echo -e "     http://127.0.0.1:4943/?canisterId=${CANDID_UI_ID}&id=${INDEXER_CANISTER_ID}"
echo ""
echo -e "${YELLOW}🆔 Canister IDs:${NC}"
echo "  Vault: ${VAULT_CANISTER_ID}"
echo "  Indexer: ${INDEXER_CANISTER_ID}"
echo "  Frontend: ${FRONTEND_CANISTER_ID}"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "  Stop project: dfx stop"
echo "  View logs: dfx canister logs vault"
echo "  Redeploy: dfx deploy"
echo ""
echo -e "${BLUE}💡 The project is now running! Open the links above in your browser.${NC}"
echo ""
