/**
 * CSS自動検証ツール
 * デザイン仕様との整合性を自動チェック
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CSSValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.validationRules = [];
        this.results = [];
    }

    // CSS検証ルールの定義
    defineValidationRules() {
        this.validationRules = [
            // ボタン関連のルール
            {
                selector: '.button',
                property: 'width',
                expected: '80px',
                tolerance: '2px',
                description: 'ボタン幅の検証'
            },
            {
                selector: '.button',
                property: 'height',
                expected: '40px',
                tolerance: '2px',
                description: 'ボタン高さの検証'
            },
            {
                selector: '.button',
                property: 'background-color',
                expected: '#4CAF50',
                expectedRGB: 'rgb(76, 175, 80)',
                description: 'ボタン背景色の検証'
            },
            {
                selector: '.button',
                property: 'margin',
                expected: '5px',
                description: 'ボタンマージンの検証'
            },
            {
                selector: '.button',
                property: 'border-radius',
                expected: '4px',
                description: 'ボタン角丸の検証'
            },
            {
                selector: '.button',
                property: 'color',
                expected: 'white',
                expectedRGB: 'rgb(255, 255, 255)',
                description: 'ボタンテキスト色の検証'
            },
            {
                selector: '.button',
                property: 'font-size',
                expected: '14px',
                description: 'ボタンフォントサイズの検証'
            },
            {
                selector: '.button',
                property: 'font-weight',
                expected: 'bold',
                expectedNumeric: '700',
                description: 'ボタンフォント太さの検証'
            },

            // レイアウト関連のルール
            {
                selector: '.left',
                property: 'width',
                expected: '40%',
                description: '左エリア幅の検証'
            },
            {
                selector: '.right',
                property: 'width',
                expected: '60%',
                description: '右エリア幅の検証'
            },
            {
                selector: '.container',
                property: 'display',
                expected: 'flex',
                description: 'コンテナのflexレイアウト検証'
            },
            {
                selector: '.container',
                property: 'flex-direction',
                expected: 'row',
                description: 'コンテナのflex方向検証'
            },

            // エラー要素関連のルール
            {
                selector: '.error',
                property: 'color',
                expected: '#FF0000',
                expectedRGB: 'rgb(255, 0, 0)',
                description: 'エラーテキスト色の検証'
            },
            {
                selector: '.error',
                property: 'font-weight',
                expected: 'bold',
                expectedNumeric: '700',
                description: 'エラーテキスト太さの検証'
            },
            {
                selector: '.error',
                property: 'background-color',
                expected: '#ffe6e6',
                expectedRGB: 'rgb(255, 230, 230)',
                description: 'エラー背景色の検証'
            },

            // チャート関連のルール
            {
                selector: '.chart',
                property: 'background-color',
                expected: '#f9f9f9',
                expectedRGB: 'rgb(249, 249, 249)',
                description: 'チャート背景色の検証'
            },
            {
                selector: '.chart',
                property: 'padding',
                expected: '20px',
                description: 'チャートパディングの検証'
            },
            {
                selector: '.chart',
                property: 'border-radius',
                expected: '8px',
                description: 'チャート角丸の検証'
            },
            {
                selector: '.chart',
                property: 'min-height',
                expected: '400px',
                description: 'チャート最小高さの検証'
            },

            // テキスト関連のルール
            {
                selector: '.list',
                property: 'font-size',
                expected: '16px',
                description: 'リストフォントサイズの検証'
            },
            {
                selector: '.list',
                property: 'line-height',
                expected: '1.5',
                description: 'リスト行間の検証'
            },
            {
                selector: '#chart-label',
                property: 'font-size',
                expected: '24px',
                description: 'チャートラベルフォントサイズの検証'
            },
            {
                selector: '#chart-label',
                property: 'font-weight',
                expected: 'bold',
                expectedNumeric: '700',
                description: 'チャートラベルフォント太さの検証'
            },
            {
                selector: '#chart-label',
                property: 'color',
                expected: '#2c3e50',
                expectedRGB: 'rgb(44, 62, 80)',
                description: 'チャートラベル色の検証'
            },

            // フォーム関連のルール
            {
                selector: 'textarea',
                property: 'border',
                expected: '1px solid #ddd',
                description: 'テキストエリアボーダーの検証'
            },
            {
                selector: 'textarea',
                property: 'border-radius',
                expected: '6px',
                description: 'テキストエリア角丸の検証'
            },
            {
                selector: 'textarea',
                property: 'font-family',
                expected: '"Courier New", monospace',
                description: 'テキストエリアフォントファミリーの検証'
            },

            // ホバー効果の検証（疑似要素）
            {
                selector: '.button:hover',
                property: 'background-color',
                expected: '#45a049',
                expectedRGB: 'rgb(69, 160, 73)',
                description: 'ボタンホバー背景色の検証',
                requiresHover: true
            }
        ];
    }

    async initialize() {
        console.log('🎨 CSS Validator を初期化中...');
        
        this.browser = await puppeteer.launch({
            headless: true,
            defaultViewport: { width: 1280, height: 720 }
        });

        this.page = await this.browser.newPage();
        
        // アプリケーションページを読み込み
        const appPath = `file://${path.join(__dirname, '../src/index.html')}`;
        await this.page.goto(appPath);
        
        // ページが完全に読み込まれるまで待機
        await this.page.waitForLoadState?.('networkidle') || 
              this.page.waitForTimeout(2000);
        
        this.defineValidationRules();
        
        console.log(`📋 ${this.validationRules.length} 個のCSS検証ルールを読み込みました`);
    }

    async validateAllRules() {
        console.log('\n🔍 CSS検証を開始...\n');
        
        for (const rule of this.validationRules) {
            await this.validateSingleRule(rule);
        }
        
        this.printSummary();
        await this.generateReport();
    }

    async validateSingleRule(rule) {
        try {
            let actualValue;
            
            if (rule.requiresHover) {
                // ホバー効果のテスト
                actualValue = await this.getHoverPropertyValue(rule.selector, rule.property);
            } else {
                // 通常のプロパティ値の取得
                actualValue = await this.getComputedStyle(rule.selector, rule.property);
            }
            
            const isValid = this.compareValues(actualValue, rule);
            
            const result = {
                selector: rule.selector,
                property: rule.property,
                expected: rule.expected,
                actual: actualValue,
                isValid,
                description: rule.description,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            
            if (isValid) {
                console.log(`✅ ${rule.description} - 期待値: ${rule.expected}, 実際値: ${actualValue}`);
            } else {
                console.log(`❌ ${rule.description} - 期待値: ${rule.expected}, 実際値: ${actualValue}`);
            }
            
        } catch (error) {
            const result = {
                selector: rule.selector,
                property: rule.property,
                expected: rule.expected,
                actual: 'ERROR',
                isValid: false,
                error: error.message,
                description: rule.description,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            console.log(`💥 ${rule.description} - エラー: ${error.message}`);
        }
    }

    async getComputedStyle(selector, property) {
        return await this.page.evaluate((sel, prop) => {
            const element = document.querySelector(sel);
            if (!element) {
                throw new Error(`Element not found: ${sel}`);
            }
            
            const computedStyle = window.getComputedStyle(element);
            return computedStyle[prop];
        }, selector, property);
    }

    async getHoverPropertyValue(selector, property) {
        // ホバー状態をシミュレート
        const baseSelector = selector.replace(':hover', '');
        
        return await this.page.evaluate((sel, prop) => {
            const element = document.querySelector(sel);
            if (!element) {
                throw new Error(`Element not found: ${sel}`);
            }
            
            // ホバー状態をシミュレート
            element.dispatchEvent(new MouseEvent('mouseenter', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
            
            // 少し待機してからスタイルを取得
            return new Promise(resolve => {
                setTimeout(() => {
                    const computedStyle = window.getComputedStyle(element);
                    resolve(computedStyle[prop]);
                }, 100);
            });
        }, baseSelector, property);
    }

    compareValues(actual, rule) {
        const expected = rule.expected;
        
        // 色の比較
        if (this.isColorProperty(rule.property)) {
            return this.compareColors(actual, rule);
        }
        
        // サイズの比較（許容誤差あり）
        if (rule.tolerance && this.isSizeProperty(rule.property)) {
            return this.compareSizesWithTolerance(actual, expected, rule.tolerance);
        }
        
        // 数値の比較（フォントウェイトなど）
        if (rule.expectedNumeric) {
            return this.compareNumericValues(actual, rule);
        }
        
        // 完全一致の比較
        return this.compareExactValues(actual, expected);
    }

    isColorProperty(property) {
        return ['color', 'background-color', 'border-color'].includes(property);
    }

    isSizeProperty(property) {
        return ['width', 'height', 'margin', 'padding', 'font-size', 'border-radius', 'min-height'].includes(property);
    }

    compareColors(actual, rule) {
        const expected = rule.expected;
        const expectedRGB = rule.expectedRGB;
        
        // HEX形式の比較
        if (expected.startsWith('#')) {
            if (actual.toLowerCase() === expected.toLowerCase()) {
                return true;
            }
            
            // RGB形式との比較
            if (expectedRGB && actual === expectedRGB) {
                return true;
            }
            
            // RGB値をHEXに変換して比較
            if (actual.startsWith('rgb')) {
                const hexFromRGB = this.rgbToHex(actual);
                return hexFromRGB.toLowerCase() === expected.toLowerCase();
            }
        }
        
        // 名前付き色の比較
        if (expected === 'white' && (actual === 'rgb(255, 255, 255)' || actual === '#ffffff')) {
            return true;
        }
        
        return false;
    }

    compareSizesWithTolerance(actual, expected, tolerance) {
        const actualValue = this.extractNumericValue(actual);
        const expectedValue = this.extractNumericValue(expected);
        const toleranceValue = this.extractNumericValue(tolerance);
        
        if (actualValue === null || expectedValue === null) {
            return actual === expected;
        }
        
        return Math.abs(actualValue - expectedValue) <= toleranceValue;
    }

    compareNumericValues(actual, rule) {
        // フォントウェイトなどの数値比較
        if (rule.property === 'font-weight') {
            const actualNumeric = actual === 'bold' ? 700 : parseInt(actual);
            const expectedNumeric = parseInt(rule.expectedNumeric);
            return actualNumeric === expectedNumeric;
        }
        
        return actual === rule.expected || actual === rule.expectedNumeric;
    }

    compareExactValues(actual, expected) {
        return actual === expected;
    }

    extractNumericValue(value) {
        if (typeof value !== 'string') return null;
        
        const match = value.match(/^([0-9.]+)/);
        return match ? parseFloat(match[1]) : null;
    }

    rgbToHex(rgb) {
        const rgbValues = rgb.match(/\d+/g);
        if (!rgbValues || rgbValues.length < 3) return null;
        
        return '#' + rgbValues.slice(0, 3)
            .map(x => parseInt(x).toString(16).padStart(2, '0'))
            .join('');
    }

    printSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.isValid).length;
        const failed = total - passed;
        const successRate = ((passed / total) * 100).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎨 CSS VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 Total Rules: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log('='.repeat(60));
        
        if (failed > 0) {
            console.log('\n❌ Failed Validations:');
            this.results
                .filter(r => !r.isValid)
                .forEach(r => {
                    console.log(`   ${r.selector} ${r.property}: expected "${r.expected}", got "${r.actual}"`);
                });
        }
    }

    async generateReport() {
        const report = {
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.isValid).length,
                failed: this.results.filter(r => !r.isValid).length,
                successRate: `${((this.results.filter(r => r.isValid).length / this.results.length) * 100).toFixed(2)}%`,
                timestamp: new Date().toISOString()
            },
            results: this.results
        };
        
        // JSON レポート
        const jsonReportPath = path.join(__dirname, 'css-validation-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
        
        // HTML レポート
        const htmlReport = this.generateHTMLReport(report);
        const htmlReportPath = path.join(__dirname, 'css-validation-report.html');
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        console.log(`\n📊 CSS validation reports generated:`);
        console.log(`   JSON: ${jsonReportPath}`);
        console.log(`   HTML: ${htmlReportPath}`);
    }

    generateHTMLReport(report) {
        const failedResults = report.results.filter(r => !r.isValid);
        const passedResults = report.results.filter(r => r.isValid);
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Validation Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #4CAF50; }
        .summary-card.failed { border-left-color: #f44336; }
        .summary-card h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .summary-card.failed .value { color: #f44336; }
        .results-section { margin-bottom: 30px; }
        .results-section h2 { color: #2c3e50; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        .result-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50; }
        .result-item.failed { border-left-color: #f44336; background: #ffebee; }
        .result-item .selector { font-weight: bold; color: #1976d2; }
        .result-item .property { font-family: monospace; background: #e8e8e8; padding: 2px 6px; border-radius: 3px; }
        .result-item .values { margin-top: 8px; font-size: 0.9em; }
        .result-item .expected { color: #4CAF50; }
        .result-item .actual { color: #f44336; }
        .toggle-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .collapsible { display: none; }
        .collapsible.show { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 CSS Validation Report</h1>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Rules</h3>
                <div class="value">${report.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value">${report.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">${report.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${report.summary.successRate}</div>
            </div>
        </div>

        ${failedResults.length > 0 ? `
        <div class="results-section">
            <h2>❌ Failed Validations (${failedResults.length})</h2>
            ${failedResults.map(result => `
                <div class="result-item failed">
                    <div class="description">${result.description}</div>
                    <div>Selector: <span class="selector">${result.selector}</span></div>
                    <div>Property: <span class="property">${result.property}</span></div>
                    <div class="values">
                        Expected: <span class="expected">${result.expected}</span><br>
                        Actual: <span class="actual">${result.actual}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="results-section">
            <h2>✅ Passed Validations (${passedResults.length})</h2>
            <button class="toggle-btn" onclick="togglePassed()">Show/Hide Passed Results</button>
            <div id="passedResults" class="collapsible">
                ${passedResults.map(result => `
                    <div class="result-item">
                        <div class="description">${result.description}</div>
                        <div>Selector: <span class="selector">${result.selector}</span></div>
                        <div>Property: <span class="property">${result.property}</span></div>
                        <div class="values">
                            Value: <span class="expected">${result.actual}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <script>
            function togglePassed() {
                const element = document.getElementById('passedResults');
                element.classList.toggle('show');
            }
        </script>
    </div>
</body>
</html>`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// スタンドアロン実行
async function main() {
    const validator = new CSSValidator();
    
    try {
        await validator.initialize();
        await validator.validateAllRules();
    } catch (error) {
        console.error('❌ CSS validation failed:', error);
        process.exit(1);
    } finally {
        await validator.cleanup();
    }
}

// モジュールとしてもスタンドアロンとしても使用可能
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CSSValidator };