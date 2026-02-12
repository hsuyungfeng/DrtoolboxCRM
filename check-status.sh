#!/bin/bash

# Doctor CRM 項目狀態檢查腳本
# 用法：./check-status.sh

set -e

echo "🔍 Doctor CRM 項目狀態檢查"
echo "=============================="
echo "檢查時間：$(date)"
echo

# 1. 檢查目錄結構
echo "📁 目錄結構檢查："
if [ -d "backend" ]; then
    echo "  ✅ backend/ 目錄存在"
    
    if [ -f "backend/package.json" ]; then
        echo "  ✅ package.json 存在"
        VERSION=$(grep '"version"' backend/package.json | cut -d'"' -f4)
        echo "  📦 項目版本：$VERSION"
    else
        echo "  ❌ package.json 不存在"
    fi
    
    if [ -d "backend/node_modules" ]; then
        COUNT=$(ls backend/node_modules | wc -l)
        echo "  📦 node_modules 包數量：$COUNT"
    else
        echo "  ❌ node_modules 不存在，請運行 npm install"
    fi
else
    echo "  ❌ backend/ 目錄不存在"
fi

echo

# 2. 檢查數據庫
echo "🗄️  數據庫檢查："
if [ -f "backend/database.sqlite" ]; then
    SIZE=$(ls -lh backend/database.sqlite | awk '{print $5}')
    echo "  ✅ SQLite 數據庫存在，大小：$SIZE"
    
    # 檢查表數量（如果 sqlite3 命令可用）
    if command -v sqlite3 &> /dev/null; then
        TABLE_COUNT=$(sqlite3 backend/database.sqlite ".tables" | wc -w 2>/dev/null || echo "0")
        echo "  📊 數據表數量：$TABLE_COUNT"
    fi
else
    echo "  ❌ database.sqlite 不存在"
fi

echo

# 3. 檢查編譯狀態
echo "🔧 編譯狀態檢查："
if [ -d "backend/dist" ]; then
    JS_FILES=$(find backend/dist -name "*.js" | wc -l)
    echo "  ✅ dist/ 目錄存在，包含 $JS_FILES 個 .js 文件"
else
    echo "  ⚠️  dist/ 目錄不存在，可能需要運行 npm run build"
fi

echo

# 4. 檢查進度文檔
echo "📋 文檔檢查："
if [ -f "progress.md" ]; then
    LAST_UPDATE=$(grep "最後更新" progress.md | head -1)
    echo "  ✅ progress.md 存在"
    echo "  $LAST_UPDATE"
else
    echo "  ❌ progress.md 不存在"
fi

echo

# 5. 檢查依賴
echo "📦 依賴檢查："
if [ -f "backend/package.json" ]; then
    echo "  ✅ 主要依賴："
    grep -A5 '"dependencies"' backend/package.json | grep -v '"dependencies"' | \
        sed 's/^/    /' | head -10
    
    if [ -d "backend/node_modules/@nestjs" ]; then
        echo "  ✅ NestJS 依賴已安裝"
    fi
    
    if [ -d "backend/node_modules/typeorm" ]; then
        echo "  ✅ TypeORM 已安裝"
    fi
fi

echo
echo "=============================="
echo "✅ 狀態檢查完成"
echo
echo "📝 建議下一步："
echo "1. 進入 backend/ 目錄：cd backend"
echo "2. 啟動開發服務器：npm run start:dev"
echo "3. 查看完整進度報告：cat ../progress.md"
echo
echo "🔗 API 端點（服務器運行後）："
echo "  - http://localhost:3000/patients"
echo "  - http://localhost:3000/treatments"
echo "  - http://localhost:3000/staff"
echo "  - http://localhost:3000/revenue"
echo
echo "💡 提示：使用 Ctrl+C 停止服務器"