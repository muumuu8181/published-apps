#!/bin/bash

# =============================================================================
# Workflow Visualizer - 包括的テストスイート実行スクリプト
# =============================================================================

set -e  # エラー時に終了

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘッダー表示
print_header() {
    echo "============================================================================="
    echo "🧪 Workflow Visualizer - 包括的テストスイート"
    echo "============================================================================="
    echo "📅 実行日時: $(date)"
    echo "📂 作業ディレクトリ: $(pwd)"
    echo "🖥️  システム: $(uname -s) $(uname -r)"
    echo "============================================================================="
    echo
}

# 前提条件のチェック
check_prerequisites() {
    log_info "前提条件をチェック中..."
    
    # Node.js のバージョンチェック
    if command -v node > /dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        log_success "Node.js detected: v${NODE_VERSION}"
        
        # バージョン16以上かチェック
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -lt "16" ]; then
            log_error "Node.js v16.0.0 以上が必要です。現在: v${NODE_VERSION}"
            exit 1
        fi
    else
        log_error "Node.js がインストールされていません"
        exit 1
    fi
    
    # npm のバージョンチェック
    if command -v npm > /dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        log_success "npm detected: v${NPM_VERSION}"
    else
        log_error "npm がインストールされていません"
        exit 1
    fi
    
    # package.json の存在確認
    if [ ! -f "package.json" ]; then
        log_error "package.json が見つかりません"
        exit 1
    fi
    
    log_success "前提条件のチェック完了"
    echo
}

# 依存関係のインストール
install_dependencies() {
    log_info "依存関係をインストール中..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "依存関係のインストール完了"
    else
        log_info "依存関係は既にインストール済みです"
    fi
    echo
}

# モックサーバーの起動
start_mock_server() {
    log_info "モックAPIサーバーを起動中..."
    
    # 既存のプロセスを終了
    pkill -f "mock-server.js" 2>/dev/null || true
    
    # バックグラウンドでサーバーを起動
    node mock-server.js &
    MOCK_SERVER_PID=$!
    
    # サーバーの起動を待機
    sleep 3
    
    # サーバーが起動しているかチェック
    if kill -0 $MOCK_SERVER_PID 2>/dev/null; then
        log_success "モックAPIサーバーが起動しました (PID: $MOCK_SERVER_PID)"
    else
        log_error "モックAPIサーバーの起動に失敗しました"
        exit 1
    fi
    echo
}

# テストの実行
run_tests() {
    local test_type=$1
    local description=$2
    
    log_info "$description を実行中..."
    
    if npm run $test_type; then
        log_success "$description が完了しました"
        return 0
    else
        log_error "$description が失敗しました"
        return 1
    fi
}

# レポートファイルの確認
check_reports() {
    log_info "生成されたレポートファイルを確認中..."
    
    local reports=(
        "comprehensive-test-report.html"
        "comprehensive-test-report.json"
        "comprehensive-test-report.csv"
        "comprehensive-test-report.md"
        "test-report.html"
        "css-validation-report.html"
        "dom-validation-report.html"
    )
    
    local found_reports=0
    
    for report in "${reports[@]}"; do
        if [ -f "$report" ]; then
            local file_size=$(stat -f%z "$report" 2>/dev/null || stat -c%s "$report" 2>/dev/null || echo "unknown")
            log_success "✓ $report ($file_size bytes)"
            found_reports=$((found_reports + 1))
        else
            log_warning "✗ $report (not found)"
        fi
    done
    
    log_info "レポートファイル: $found_reports/${#reports[@]} 個見つかりました"
    echo
}

# クリーンアップ
cleanup() {
    log_info "クリーンアップを実行中..."
    
    # モックサーバーの終了
    if [ ! -z "$MOCK_SERVER_PID" ]; then
        if kill $MOCK_SERVER_PID 2>/dev/null; then
            log_success "モックAPIサーバーを終了しました"
        fi
    fi
    
    # 他のプロセスも確実に終了
    pkill -f "mock-server.js" 2>/dev/null || true
    pkill -f "run-tests.js" 2>/dev/null || true
    
    log_success "クリーンアップ完了"
}

# メイン実行関数
main() {
    local start_time=$(date +%s)
    local failed_tests=()
    
    print_header
    
    # SIGINTとSIGTERMでクリーンアップを実行
    trap cleanup EXIT INT TERM
    
    # 前提条件のチェック
    check_prerequisites
    
    # 依存関係のインストール
    install_dependencies
    
    # モックサーバーの起動
    start_mock_server
    
    # テストの実行
    log_info "🧪 テスト実行を開始します..."
    echo
    
    # 1. CSS検証テスト
    if ! run_tests "test:css" "CSS検証テスト"; then
        failed_tests+=("CSS検証")
    fi
    echo
    
    # 2. DOM検証テスト
    if ! run_tests "test:dom" "DOM検証テスト"; then
        failed_tests+=("DOM検証")
    fi
    echo
    
    # 3. 機能テスト
    if ! run_tests "test:functional" "機能テスト"; then
        failed_tests+=("機能テスト")
    fi
    echo
    
    # 4. 包括的レポート生成
    if ! run_tests "test:comprehensive" "包括的テスト（レポート生成込み）"; then
        failed_tests+=("包括的テスト")
    fi
    echo
    
    # レポートファイルの確認
    check_reports
    
    # 実行時間の計算
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    # 結果サマリー
    echo "============================================================================="
    echo "🎯 テスト実行完了"
    echo "============================================================================="
    echo "⏱️  総実行時間: ${minutes}分${seconds}秒"
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_success "🎉 すべてのテストが正常に完了しました！"
        echo
        echo "📊 生成されたレポート:"
        echo "   • comprehensive-test-report.html (メインレポート)"
        echo "   • comprehensive-test-report.json (詳細データ)"
        echo "   • comprehensive-test-report.csv (CSV形式)"
        echo "   • comprehensive-test-report.md (Markdown要約)"
        echo
        echo "🌐 HTMLレポートをブラウザで開くには:"
        echo "   open comprehensive-test-report.html"
        echo "または"
        echo "   xdg-open comprehensive-test-report.html  # Linux"
        echo "   start comprehensive-test-report.html    # Windows"
        echo "============================================================================="
        exit 0
    else
        log_error "❌ 以下のテストが失敗しました:"
        for test in "${failed_tests[@]}"; do
            echo "   • $test"
        done
        echo
        echo "詳細なエラー情報は上記のログを確認してください。"
        echo "============================================================================="
        exit 1
    fi
}

# ヘルプ表示
show_help() {
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -h, --help    このヘルプを表示"
    echo "  -c, --clean   実行前にレポートファイルをクリーンアップ"
    echo "  -q, --quiet   詳細ログを抑制"
    echo "  -v, --verbose 詳細ログを表示"
    echo
    echo "Examples:"
    echo "  $0              # 標準実行"
    echo "  $0 --clean     # クリーンアップしてから実行"
    echo "  $0 --verbose   # 詳細ログで実行"
    echo
}

# コマンドライン引数の処理
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--clean)
            log_info "レポートファイルをクリーンアップ中..."
            npm run clean 2>/dev/null || rm -f *.html *.json *.csv *.md
            log_success "クリーンアップ完了"
            shift
            ;;
        -q|--quiet)
            exec > /dev/null 2>&1
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# メイン関数の実行
main