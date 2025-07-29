/**
 * DOM要素検証ツール
 * HTML構造、アクセシビリティ、セマンティクスを自動チェック
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DOMValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.validationRules = [];
        this.results = [];
    }

    // DOM検証ルールの定義
    defineValidationRules() {
        this.validationRules = [
            // 基本的なHTML構造
            {
                type: 'element_exists',
                selector: 'html[lang="ja"]',
                description: 'HTML要素に適切な言語属性が設定されている'
            },
            {
                type: 'element_exists',
                selector: 'head meta[charset="UTF-8"]',
                description: '文字エンコーディングが正しく設定されている'
            },
            {
                type: 'element_exists',
                selector: 'head meta[name="viewport"]',
                description: 'ビューポートメタタグが設定されている'
            },
            {
                type: 'element_exists',
                selector: 'title',
                description: 'ページタイトルが設定されている'
            },

            // メインコンテナ構造
            {
                type: 'element_exists',
                selector: '.container',
                description: 'メインコンテナが存在する'
            },
            {
                type: 'element_exists',
                selector: '.left',
                description: '左パネルが存在する'
            },
            {
                type: 'element_exists',
                selector: '.right',
                description: '右パネルが存在する'
            },

            // フォーム要素の検証
            {
                type: 'element_exists',
                selector: '#file-upload',
                description: 'ファイルアップロード要素が存在する'
            },
            {
                type: 'element_exists',
                selector: '#log-input',
                description: 'ログ入力テキストエリアが存在する'
            },
            {
                type: 'element_exists',
                selector: '#visualize-btn',
                description: '視覚化ボタンが存在する'
            },
            {
                type: 'element_exists',
                selector: '#export-btn',
                description: 'エクスポートボタンが存在する'
            },

            // チャート要素の検証
            {
                type: 'element_exists',
                selector: '#workflowChart',
                description: 'ワークフローチャートキャンバスが存在する'
            },
            {
                type: 'element_exists',
                selector: '#chart-label',
                description: 'チャートラベルが存在する'
            },

            // エラー表示要素
            {
                type: 'element_exists',
                selector: '#error-message',
                description: 'エラーメッセージ要素が存在する'
            },

            // インサイト要素
            {
                type: 'element_exists',
                selector: '#insights-list',
                description: 'インサイトリスト要素が存在する'
            },

            // アクセシビリティ検証
            {
                type: 'accessibility',
                selector: 'label[for="file-upload"]',
                description: 'ファイルアップロードにラベルが関連付けられている'
            },
            {
                type: 'accessibility',
                selector: 'label[for="log-input"]',
                description: 'ログ入力にラベルが関連付けられている'
            },
            {
                type: 'element_exists',
                selector: '#status-message[aria-live="polite"]',
                description: 'スクリーンリーダー用のステータスメッセージが設定されている'
            },

            // 属性の検証
            {
                type: 'attribute_check',
                selector: '#file-upload',
                attribute: 'accept',
                expected: '.json',
                description: 'ファイルアップロードが.jsonファイルのみ受け入れる'
            },
            {
                type: 'attribute_check',
                selector: '#file-upload',
                attribute: 'type',
                expected: 'file',
                description: 'ファイル入力のtype属性が正しい'
            },
            {
                type: 'attribute_check',
                selector: '#log-input',
                attribute: 'rows',
                expected: '8',
                description: 'テキストエリアの行数が適切に設定されている'
            },

            // ボタンの検証
            {
                type: 'element_class',
                selector: '#visualize-btn',
                expectedClass: 'button',
                description: '視覚化ボタンに適切なクラスが設定されている'
            },
            {
                type: 'element_class',
                selector: '#export-btn',
                expectedClass: 'button',
                description: 'エクスポートボタンに適切なクラスが設定されている'
            },

            // 初期状態の検証
            {
                type: 'element_hidden',
                selector: '#error-message',
                description: 'エラーメッセージが初期状態では非表示'
            },

            // チャートキャンバスの属性
            {
                type: 'attribute_check',
                selector: '#workflowChart',
                attribute: 'width',
                expected: '400',
                description: 'チャートキャンバスの幅が設定されている'
            },
            {
                type: 'attribute_check',
                selector: '#workflowChart',
                attribute: 'height',
                expected: '300',
                description: 'チャートキャンバスの高さが設定されている'
            },

            // セクション構造の検証
            {
                type: 'element_exists',
                selector: '.upload-section',
                description: 'アップロードセクションが存在する'
            },
            {
                type: 'element_exists',
                selector: '.insights-section',
                description: 'インサイトセクションが存在する'
            },
            {
                type: 'element_exists',
                selector: '.chart-section',
                description: 'チャートセクションが存在する'
            },

            // 見出し構造の検証
            {
                type: 'heading_structure',
                description: '見出し構造が適切に設定されている'
            },

            // スクリプトとスタイルシートの読み込み
            {
                type: 'element_exists',
                selector: 'script[src*="chart.js"]',
                description: 'Chart.jsライブラリが読み込まれている'
            },
            {
                type: 'element_exists',
                selector: 'link[href="styles.css"]',
                description: 'CSSファイルが読み込まれている'
            },
            {
                type: 'element_exists',
                selector: 'script[src="script.js"]',
                description: 'メインJavaScriptファイルが読み込まれている'
            },

            // フォーカス管理
            {
                type: 'focusable_elements',
                description: 'フォーカス可能な要素が適切に設定されている'
            },

            // セマンティックHTML
            {
                type: 'semantic_check',
                description: 'セマンティックなHTML構造が使用されている'
            }
        ];
    }

    async initialize() {
        console.log('🏗️  DOM Validator を初期化中...');
        
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
        
        console.log(`📋 ${this.validationRules.length} 個のDOM検証ルールを読み込みました`);
    }

    async validateAllRules() {
        console.log('\n🔍 DOM検証を開始...\n');
        
        for (const rule of this.validationRules) {
            await this.validateSingleRule(rule);
        }
        
        this.printSummary();
        await this.generateReport();
    }

    async validateSingleRule(rule) {
        try {
            let isValid = false;
            let actualValue = null;
            let details = {};
            
            switch (rule.type) {
                case 'element_exists':
                    isValid = await this.checkElementExists(rule.selector);
                    break;
                    
                case 'element_hidden':
                    isValid = await this.checkElementHidden(rule.selector);
                    break;
                    
                case 'element_class':
                    ({ isValid, actualValue } = await this.checkElementClass(rule.selector, rule.expectedClass));
                    break;
                    
                case 'attribute_check':
                    ({ isValid, actualValue } = await this.checkAttribute(rule.selector, rule.attribute, rule.expected));
                    break;
                    
                case 'accessibility':
                    isValid = await this.checkAccessibility(rule);
                    break;
                    
                case 'heading_structure':
                    ({ isValid, details } = await this.checkHeadingStructure());
                    break;
                    
                case 'focusable_elements':
                    ({ isValid, details } = await this.checkFocusableElements());
                    break;
                    
                case 'semantic_check':
                    ({ isValid, details } = await this.checkSemanticStructure());
                    break;
                    
                default:
                    throw new Error(`Unknown validation type: ${rule.type}`);
            }
            
            const result = {
                type: rule.type,
                selector: rule.selector || 'N/A',
                description: rule.description,
                isValid,
                actualValue,
                details,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            
            if (isValid) {
                console.log(`✅ ${rule.description}`);
            } else {
                console.log(`❌ ${rule.description}${actualValue ? ` - 実際値: ${actualValue}` : ''}`);
            }
            
        } catch (error) {
            const result = {
                type: rule.type,
                selector: rule.selector || 'N/A',
                description: rule.description,
                isValid: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            console.log(`💥 ${rule.description} - エラー: ${error.message}`);
        }
    }

    async checkElementExists(selector) {
        return await this.page.evaluate(sel => {
            return document.querySelector(sel) !== null;
        }, selector);
    }

    async checkElementHidden(selector) {
        return await this.page.evaluate(sel => {
            const element = document.querySelector(sel);
            if (!element) return false;
            
            const style = window.getComputedStyle(element);
            return style.display === 'none' || style.visibility === 'hidden' || element.hidden;
        }, selector);
    }

    async checkElementClass(selector, expectedClass) {
        const result = await this.page.evaluate((sel, className) => {
            const element = document.querySelector(sel);
            if (!element) return { exists: false, classes: [] };
            
            return {
                exists: true,
                classes: Array.from(element.classList),
                hasClass: element.classList.contains(className)
            };
        }, selector, expectedClass);
        
        if (!result.exists) {
            return { isValid: false, actualValue: 'Element not found' };
        }
        
        return {
            isValid: result.hasClass,
            actualValue: result.classes.join(', ')
        };
    }

    async checkAttribute(selector, attribute, expectedValue) {
        const result = await this.page.evaluate((sel, attr) => {
            const element = document.querySelector(sel);
            if (!element) return { exists: false, value: null };
            
            return {
                exists: true,
                value: element.getAttribute(attr)
            };
        }, selector, attribute);
        
        if (!result.exists) {
            return { isValid: false, actualValue: 'Element not found' };
        }
        
        return {
            isValid: result.value === expectedValue,
            actualValue: result.value
        };
    }

    async checkAccessibility(rule) {
        if (rule.selector.includes('label[for=')) {
            // ラベルと入力要素の関連付けチェック
            return await this.page.evaluate(sel => {
                const label = document.querySelector(sel);
                if (!label) return false;
                
                const forAttr = label.getAttribute('for');
                if (!forAttr) return false;
                
                const targetElement = document.getElementById(forAttr);
                return targetElement !== null;
            }, rule.selector);
        }
        
        if (rule.selector.includes('[aria-live=')) {
            // ARIA属性のチェック
            return await this.checkElementExists(rule.selector);
        }
        
        return false;
    }

    async checkHeadingStructure() {
        const headings = await this.page.evaluate(() => {
            const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            return Array.from(headingElements).map(h => ({
                tag: h.tagName.toLowerCase(),
                text: h.textContent.trim(),
                level: parseInt(h.tagName.charAt(1))
            }));
        });
        
        let isValid = true;
        const issues = [];
        
        // H1が存在するかチェック
        const h1Count = headings.filter(h => h.level === 1).length;
        if (h1Count === 0) {
            issues.push('H1見出しが存在しません');
            isValid = false;
        } else if (h1Count > 1) {
            issues.push('H1見出しが複数存在します');
            isValid = false;
        }
        
        // 見出しレベルの順序チェック
        for (let i = 1; i < headings.length; i++) {
            const current = headings[i];
            const previous = headings[i - 1];
            
            if (current.level > previous.level + 1) {
                issues.push(`見出しレベルがスキップされています: ${previous.tag} → ${current.tag}`);
                isValid = false;
            }
        }
        
        return {
            isValid,
            details: {
                headings,
                issues
            }
        };
    }

    async checkFocusableElements() {
        const focusableElements = await this.page.evaluate(() => {
            const focusableSelectors = [
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])'
            ];
            
            const elements = [];
            focusableSelectors.forEach(selector => {
                const found = document.querySelectorAll(selector);
                Array.from(found).forEach(el => {
                    elements.push({
                        tag: el.tagName.toLowerCase(),
                        id: el.id || null,
                        class: el.className || null,
                        tabindex: el.tabIndex,
                        type: el.type || null
                    });
                });
            });
            
            return elements;
        });
        
        const issues = [];
        let isValid = true;
        
        // フォーカス可能な要素が存在するかチェック
        if (focusableElements.length === 0) {
            issues.push('フォーカス可能な要素が存在しません');
            isValid = false;
        }
        
        // 重要な要素にフォーカスが可能かチェック
        const requiredFocusable = ['#visualize-btn', '#export-btn', '#file-upload', '#log-input'];
        for (const selector of requiredFocusable) {
            const exists = await this.checkElementExists(selector);
            if (!exists) {
                issues.push(`必要な要素が存在しません: ${selector}`);
                isValid = false;
            }
        }
        
        return {
            isValid,
            details: {
                focusableElements,
                issues
            }
        };
    }

    async checkSemanticStructure() {
        const semanticInfo = await this.page.evaluate(() => {
            const semanticElements = [
                'header', 'nav', 'main', 'section', 'article', 'aside', 'footer'
            ];
            
            const found = {};
            semanticElements.forEach(tag => {
                found[tag] = document.querySelectorAll(tag).length;
            });
            
            // form要素の使用状況
            const forms = document.querySelectorAll('form');
            const formInfo = Array.from(forms).map(form => ({
                id: form.id || null,
                method: form.method || null,
                action: form.action || null
            }));
            
            // 見出し要素の使用状況
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            
            return {
                semanticElements: found,
                forms: formInfo,
                headingCount: headings.length,
                hasDoctype: document.doctype !== null,
                lang: document.documentElement.lang || null
            };
        });
        
        const issues = [];
        let isValid = true;
        
        // DOCTYPE宣言のチェック
        if (!semanticInfo.hasDoctype) {
            issues.push('DOCTYPE宣言が存在しません');
            isValid = false;
        }
        
        // lang属性のチェック
        if (!semanticInfo.lang) {
            issues.push('html要素にlang属性が設定されていません');
            isValid = false;
        }
        
        // 見出し要素の使用チェック
        if (semanticInfo.headingCount === 0) {
            issues.push('見出し要素が使用されていません');
            isValid = false;
        }
        
        // セマンティック要素の推奨使用チェック（警告レベル）
        const recommendedElements = ['header', 'main', 'section'];
        recommendedElements.forEach(element => {
            if (semanticInfo.semanticElements[element] === 0) {
                issues.push(`推奨されるセマンティック要素が使用されていません: ${element}`);
                // 警告レベルなので isValid は false にしない
            }
        });
        
        return {
            isValid,
            details: {
                semanticInfo,
                issues
            }
        };
    }

    printSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.isValid).length;
        const failed = total - passed;
        const successRate = ((passed / total) * 100).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('🏗️  DOM VALIDATION SUMMARY');
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
                    console.log(`   ${r.description}`);
                    if (r.error) {
                        console.log(`      Error: ${r.error}`);
                    }
                    if (r.actualValue && r.actualValue !== 'Element not found') {
                        console.log(`      Actual: ${r.actualValue}`);
                    }
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
            results: this.results,
            categories: {
                structure: this.results.filter(r => r.type === 'element_exists').length,
                accessibility: this.results.filter(r => r.type === 'accessibility').length,
                attributes: this.results.filter(r => r.type === 'attribute_check').length,
                semantic: this.results.filter(r => r.type === 'semantic_check').length
            }
        };
        
        // JSON レポート
        const jsonReportPath = path.join(__dirname, 'dom-validation-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
        
        // HTML レポート
        const htmlReport = this.generateHTMLReport(report);
        const htmlReportPath = path.join(__dirname, 'dom-validation-report.html');
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        console.log(`\n📊 DOM validation reports generated:`);
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
    <title>DOM Validation Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #4CAF50; }
        .summary-card.failed { border-left-color: #f44336; }
        .summary-card h3 { margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .summary-card.failed .value { color: #f44336; }
        .category-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .category-card { background: #e8f5e8; padding: 15px; border-radius: 6px; text-align: center; }
        .results-section { margin-bottom: 30px; }
        .results-section h2 { color: #2c3e50; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        .result-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50; }
        .result-item.failed { border-left-color: #f44336; background: #ffebee; }
        .result-item .type { display: inline-block; background: #e0e0e0; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-bottom: 8px; }
        .result-item .selector { font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        .result-item .details { margin-top: 10px; font-size: 0.9em; color: #666; }
        .toggle-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .collapsible { display: none; }
        .collapsible.show { display: block; }
        .error-details { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏗️ DOM Validation Report</h1>
        
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

        <div class="category-stats">
            <div class="category-card">
                <h4>Structure</h4>
                <div>${report.categories.structure} rules</div>
            </div>
            <div class="category-card">
                <h4>Accessibility</h4>
                <div>${report.categories.accessibility} rules</div>
            </div>
            <div class="category-card">
                <h4>Attributes</h4>
                <div>${report.categories.attributes} rules</div>
            </div>
            <div class="category-card">
                <h4>Semantic</h4>
                <div>${report.categories.semantic} rules</div>
            </div>
        </div>

        ${failedResults.length > 0 ? `
        <div class="results-section">
            <h2>❌ Failed Validations (${failedResults.length})</h2>
            ${failedResults.map(result => `
                <div class="result-item failed">
                    <div class="type">${result.type}</div>
                    <div class="description">${result.description}</div>
                    ${result.selector !== 'N/A' ? `<div>Selector: <span class="selector">${result.selector}</span></div>` : ''}
                    ${result.actualValue ? `<div>Actual Value: <span class="actual">${result.actualValue}</span></div>` : ''}
                    ${result.error ? `<div class="error-details">Error: ${result.error}</div>` : ''}
                    ${result.details && Object.keys(result.details).length > 0 ? `
                        <div class="details">
                            <strong>Details:</strong>
                            <pre>${JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                    ` : ''}
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
                        <div class="type">${result.type}</div>
                        <div class="description">${result.description}</div>
                        ${result.selector !== 'N/A' ? `<div>Selector: <span class="selector">${result.selector}</span></div>` : ''}
                        ${result.actualValue ? `<div>Value: <span class="actual">${result.actualValue}</span></div>` : ''}
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
    const validator = new DOMValidator();
    
    try {
        await validator.initialize();
        await validator.validateAllRules();
    } catch (error) {
        console.error('❌ DOM validation failed:', error);
        process.exit(1);
    } finally {
        await validator.cleanup();
    }
}

// モジュールとしてもスタンドアロンとしても使用可能
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DOMValidator };