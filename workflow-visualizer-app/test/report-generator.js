/**
 * 包括的テストレポート生成ツール
 * 全テストツールの結果を統合して総合レポートを作成
 */

const fs = require('fs');
const path = require('path');
const { WorkflowVisualizerTestRunner } = require('./run-tests');
const { CSSValidator } = require('./css-validator');
const { DOMValidator } = require('./dom-validator');

class ComprehensiveReportGenerator {
    constructor() {
        this.testRunner = new WorkflowVisualizerTestRunner();
        this.cssValidator = new CSSValidator();
        this.domValidator = new DOMValidator();
        this.allResults = {
            functional: [],
            css: [],
            dom: [],
            summary: {}
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 包括的テスト実行を開始...\n');

        try {
            // 1. 機能テストの実行
            console.log('1️⃣ 機能テスト実行中...');
            await this.testRunner.initialize();
            await this.testRunner.runAllTests();
            this.allResults.functional = this.testRunner.resultManager.results;
            await this.testRunner.cleanup();
            
            // 2. CSS検証の実行
            console.log('\n2️⃣ CSS検証実行中...');
            await this.cssValidator.initialize();
            await this.cssValidator.validateAllRules();
            this.allResults.css = this.cssValidator.results;
            await this.cssValidator.cleanup();
            
            // 3. DOM検証の実行
            console.log('\n3️⃣ DOM検証実行中...');
            await this.domValidator.initialize();
            await this.domValidator.validateAllRules();
            this.allResults.dom = this.domValidator.results;
            await this.domValidator.cleanup();
            
            // 4. 統合レポートの生成
            console.log('\n4️⃣ 統合レポート生成中...');
            await this.generateComprehensiveReport();
            
            this.printOverallSummary();
            
        } catch (error) {
            console.error('❌ テスト実行でエラーが発生:', error);
            throw error;
        }
    }

    calculateSummary() {
        const functional = this.summarizeResults(this.allResults.functional, 'functional');
        const css = this.summarizeResults(this.allResults.css, 'css');
        const dom = this.summarizeResults(this.allResults.dom, 'dom');
        
        const totalTests = functional.total + css.total + dom.total;
        const totalPassed = functional.passed + css.passed + dom.passed;
        const totalFailed = functional.failed + css.failed + dom.failed;
        const totalSkipped = functional.skipped + css.skipped + dom.skipped;
        
        const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0.00';
        
        return {
            overall: {
                total: totalTests,
                passed: totalPassed,
                failed: totalFailed,
                skipped: totalSkipped,
                successRate: `${overallSuccessRate}%`,
                executionTime: Date.now() - this.startTime
            },
            breakdown: {
                functional,
                css,
                dom
            },
            timestamp: new Date().toISOString()
        };
    }

    summarizeResults(results, type) {
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        
        if (type === 'functional') {
            passed = results.filter(r => r.status === 'PASS').length;
            failed = results.filter(r => r.status === 'FAIL').length;
            skipped = results.filter(r => r.status === 'SKIP').length;
        } else {
            // CSS and DOM validators
            passed = results.filter(r => r.isValid).length;
            failed = results.filter(r => !r.isValid).length;
            skipped = 0; // CSS/DOM validators don't skip tests
        }
        
        const total = passed + failed + skipped;
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
        
        return {
            total,
            passed,
            failed,
            skipped,
            successRate: `${successRate}%`
        };
    }

    async generateComprehensiveReport() {
        this.allResults.summary = this.calculateSummary();
        
        // JSON 統合レポート
        const jsonReport = {
            metadata: {
                generatedAt: new Date().toISOString(),
                testSuite: 'Workflow Visualizer Comprehensive Test Suite',
                version: '1.0.0',
                totalExecutionTime: `${this.allResults.summary.overall.executionTime}ms`
            },
            summary: this.allResults.summary,
            results: {
                functional: this.allResults.functional,
                css: this.allResults.css,
                dom: this.allResults.dom
            },
            recommendations: this.generateRecommendations()
        };
        
        const jsonPath = path.join(__dirname, 'comprehensive-test-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
        
        // HTML 統合レポート
        const htmlReport = this.generateHTMLReport(jsonReport);
        const htmlPath = path.join(__dirname, 'comprehensive-test-report.html');
        fs.writeFileSync(htmlPath, htmlReport);
        
        // CSV 統合レポート
        const csvReport = this.generateCSVReport(jsonReport);
        const csvPath = path.join(__dirname, 'comprehensive-test-report.csv');
        fs.writeFileSync(csvPath, csvReport);
        
        // マークダウン レポート
        const mdReport = this.generateMarkdownReport(jsonReport);
        const mdPath = path.join(__dirname, 'comprehensive-test-report.md');
        fs.writeFileSync(mdPath, mdReport);
        
        console.log('\n📊 統合レポートが生成されました:');
        console.log(`   📄 JSON: ${jsonPath}`);
        console.log(`   🌐 HTML: ${htmlPath}`);
        console.log(`   📊 CSV: ${csvPath}`);
        console.log(`   📝 Markdown: ${mdPath}`);
    }

    generateRecommendations() {
        const recommendations = [];
        const { breakdown } = this.allResults.summary;
        
        // 機能テストの推奨事項
        if (parseFloat(breakdown.functional.successRate) < 95) {
            recommendations.push({
                category: 'Functional',
                priority: 'High',
                issue: `機能テストの成功率が${breakdown.functional.successRate}と低い`,
                recommendation: '失敗したテストケースを確認し、アプリケーションロジックを改善してください'
            });
        }
        
        // CSSテストの推奨事項
        if (parseFloat(breakdown.css.successRate) < 90) {
            recommendations.push({
                category: 'CSS',
                priority: 'Medium',
                issue: `CSSバリデーションの成功率が${breakdown.css.successRate}`,
                recommendation: 'デザイン仕様との差異を確認し、CSSスタイルを調整してください'
            });
        }
        
        // DOMテストの推奨事項
        if (parseFloat(breakdown.dom.successRate) < 85) {
            recommendations.push({
                category: 'DOM',
                priority: 'High',
                issue: `DOM構造の検証成功率が${breakdown.dom.successRate}`,
                recommendation: 'HTMLの構造とアクセシビリティを改善してください'
            });
        }
        
        // 全体的な推奨事項
        const overallSuccessRate = parseFloat(this.allResults.summary.overall.successRate);
        if (overallSuccessRate < 90) {
            recommendations.push({
                category: 'Overall',
                priority: 'High',
                issue: `全体的な成功率が${this.allResults.summary.overall.successRate}と低い`,
                recommendation: '包括的な品質改善計画を立案し、段階的に修正を行ってください'
            });
        }
        
        // セキュリティ関連の推奨事項
        const securityFailures = this.allResults.functional.filter(r => 
            r.name && r.name.toLowerCase().includes('xss') && r.status === 'FAIL'
        );
        
        if (securityFailures.length > 0) {
            recommendations.push({
                category: 'Security',
                priority: 'Critical',
                issue: 'セキュリティテストで失敗が検出された',
                recommendation: 'XSS対策など、セキュリティ脆弱性を緊急に修正してください'
            });
        }
        
        // パフォーマンス関連の推奨事項
        const performanceFailures = this.allResults.functional.filter(r => 
            r.name && r.name.toLowerCase().includes('performance') && r.status === 'FAIL'
        );
        
        if (performanceFailures.length > 0) {
            recommendations.push({
                category: 'Performance',
                priority: 'Medium',
                issue: 'パフォーマンステストで問題が検出された',
                recommendation: 'アプリケーションの応答時間とレンダリング速度を最適化してください'
            });
        }
        
        return recommendations;
    }

    generateHTMLReport(jsonReport) {
        const { summary, results, recommendations } = jsonReport;
        
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Visualizer - 包括的テストレポート</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; color: #2c3e50; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 0; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-bottom: 40px; }
        .summary-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 5px solid #4CAF50; transition: transform 0.2s; }
        .summary-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.15); }
        .summary-card.warning { border-left-color: #ff9800; }
        .summary-card.danger { border-left-color: #f44336; }
        .summary-card h3 { color: #2c3e50; margin-bottom: 15px; font-size: 1.1em; }
        .summary-card .metric { font-size: 2.5em; font-weight: bold; color: #4CAF50; margin-bottom: 5px; }
        .summary-card.warning .metric { color: #ff9800; }
        .summary-card.danger .metric { color: #f44336; }
        .summary-card .label { color: #7f8c8d; font-size: 0.9em; }
        .breakdown { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .breakdown h2 { color: #2c3e50; margin-bottom: 20px; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .breakdown-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .breakdown-item { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .breakdown-item h4 { color: #2c3e50; margin-bottom: 10px; }
        .breakdown-item .stats { display: flex; justify-content: space-between; margin-top: 15px; }
        .breakdown-item .stat { text-align: center; }
        .breakdown-item .stat-value { font-weight: bold; font-size: 1.2em; }
        .stat-value.pass { color: #4CAF50; }
        .stat-value.fail { color: #f44336; }
        .stat-value.skip { color: #ff9800; }
        .recommendations { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .recommendations h2 { color: #2c3e50; margin-bottom: 20px; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .recommendation.critical { background: #f8d7da; border-color: #f5c6cb; }
        .recommendation.high { background: #fff3cd; border-color: #ffeaa7; }
        .recommendation.medium { background: #d1ecf1; border-color: #bee5eb; }
        .recommendation .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; margin-bottom: 8px; }
        .priority.critical { background: #dc3545; color: white; }
        .priority.high { background: #ffc107; color: #212529; }
        .priority.medium { background: #17a2b8; color: white; }
        .section { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .section h2 { color: #2c3e50; margin-bottom: 20px; border-bottom: 3px solid #9b59b6; padding-bottom: 10px; }
        .test-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .test-table th, .test-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .test-table th { background-color: #f8f9fa; font-weight: 600; color: #2c3e50; }
        .test-table .status-pass { color: #4CAF50; font-weight: bold; }
        .test-table .status-fail { color: #f44336; font-weight: bold; }
        .test-table .status-skip { color: #ff9800; font-weight: bold; }
        .toggle-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin: 10px 5px; transition: background 0.2s; }
        .toggle-btn:hover { background: #2980b9; }
        .toggle-btn.active { background: #2c3e50; }
        .collapsible { display: none; }
        .collapsible.show { display: block; }
        .footer { text-align: center; padding: 40px 20px; color: #7f8c8d; }
        .progress-bar { width: 100%; height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.3s ease; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Workflow Visualizer</h1>
        <p>包括的テストレポート - 100項目のテスト結果</p>
        <p>生成日時: ${new Date(jsonReport.metadata.generatedAt).toLocaleString('ja-JP')}</p>
    </div>

    <div class="container">
        <!-- 全体サマリー -->
        <div class="summary-grid">
            <div class="summary-card ${parseFloat(summary.overall.successRate) < 80 ? 'danger' : parseFloat(summary.overall.successRate) < 90 ? 'warning' : ''}">
                <h3>🎯 全体成功率</h3>
                <div class="metric">${summary.overall.successRate}</div>
                <div class="label">${summary.overall.passed}/${summary.overall.total} テスト</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${parseFloat(summary.overall.successRate)}%"></div>
                </div>
            </div>
            <div class="summary-card">
                <h3>✅ 成功テスト</h3>
                <div class="metric">${summary.overall.passed}</div>
                <div class="label">テスト成功</div>
            </div>
            <div class="summary-card ${summary.overall.failed > 0 ? 'danger' : ''}">
                <h3>❌ 失敗テスト</h3>
                <div class="metric">${summary.overall.failed}</div>
                <div class="label">テスト失敗</div>
            </div>
            <div class="summary-card">
                <h3>⏱️ 実行時間</h3>
                <div class="metric">${(summary.overall.executionTime / 1000).toFixed(1)}s</div>
                <div class="label">総実行時間</div>
            </div>
        </div>

        <!-- カテゴリ別の詳細 -->
        <div class="breakdown">
            <h2>📊 カテゴリ別結果</h2>
            <div class="breakdown-grid">
                <div class="breakdown-item">
                    <h4>🔧 機能テスト</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${parseFloat(summary.breakdown.functional.successRate)}%"></div>
                    </div>
                    <div>成功率: ${summary.breakdown.functional.successRate}</div>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value pass">${summary.breakdown.functional.passed}</div>
                            <div>成功</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value fail">${summary.breakdown.functional.failed}</div>
                            <div>失敗</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value skip">${summary.breakdown.functional.skipped}</div>
                            <div>スキップ</div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-item">
                    <h4>🎨 CSS検証</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${parseFloat(summary.breakdown.css.successRate)}%"></div>
                    </div>
                    <div>成功率: ${summary.breakdown.css.successRate}</div>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value pass">${summary.breakdown.css.passed}</div>
                            <div>成功</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value fail">${summary.breakdown.css.failed}</div>
                            <div>失敗</div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-item">
                    <h4>🏗️ DOM検証</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${parseFloat(summary.breakdown.dom.successRate)}%"></div>
                    </div>
                    <div>成功率: ${summary.breakdown.dom.successRate}</div>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value pass">${summary.breakdown.dom.passed}</div>
                            <div>成功</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value fail">${summary.breakdown.dom.failed}</div>
                            <div>失敗</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${recommendations.length > 0 ? `
        <!-- 推奨事項 -->
        <div class="recommendations">
            <h2>💡 改善推奨事項</h2>
            ${recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <div class="priority ${rec.priority.toLowerCase()}">${rec.priority}</div>
                    <strong>${rec.category}:</strong> ${rec.issue}<br>
                    <strong>推奨対策:</strong> ${rec.recommendation}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- 詳細結果 -->
        <div class="section">
            <h2>📋 詳細テスト結果</h2>
            <div>
                <button class="toggle-btn active" onclick="showSection('functional')">機能テスト (${summary.breakdown.functional.total})</button>
                <button class="toggle-btn" onclick="showSection('css')">CSS検証 (${summary.breakdown.css.total})</button>
                <button class="toggle-btn" onclick="showSection('dom')">DOM検証 (${summary.breakdown.dom.total})</button>
            </div>

            <div id="functional-section" class="collapsible show">
                <h3>🔧 機能テスト結果</h3>
                <table class="test-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>テスト名</th>
                            <th>ステータス</th>
                            <th>実行時間</th>
                            <th>メッセージ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.functional.map(test => `
                            <tr>
                                <td>${test.id}</td>
                                <td>${test.name}</td>
                                <td class="status-${test.status.toLowerCase()}">${test.status}</td>
                                <td>${test.duration}ms</td>
                                <td>${test.message || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div id="css-section" class="collapsible">
                <h3>🎨 CSS検証結果</h3>
                <table class="test-table">
                    <thead>
                        <tr>
                            <th>セレクタ</th>
                            <th>プロパティ</th>
                            <th>説明</th>
                            <th>ステータス</th>
                            <th>期待値</th>
                            <th>実際値</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.css.map(test => `
                            <tr>
                                <td><code>${test.selector}</code></td>
                                <td><code>${test.property}</code></td>
                                <td>${test.description}</td>
                                <td class="status-${test.isValid ? 'pass' : 'fail'}">${test.isValid ? 'PASS' : 'FAIL'}</td>
                                <td>${test.expected}</td>
                                <td>${test.actual}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div id="dom-section" class="collapsible">
                <h3>🏗️ DOM検証結果</h3>
                <table class="test-table">
                    <thead>
                        <tr>
                            <th>タイプ</th>
                            <th>セレクタ</th>
                            <th>説明</th>
                            <th>ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.dom.map(test => `
                            <tr>
                                <td>${test.type}</td>
                                <td><code>${test.selector}</code></td>
                                <td>${test.description}</td>
                                <td class="status-${test.isValid ? 'pass' : 'fail'}">${test.isValid ? 'PASS' : 'FAIL'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🧪 Workflow Visualizer Test Suite v${jsonReport.metadata.version}</p>
        <p>Generated by Claude Code Test Framework</p>
    </div>

    <script>
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.collapsible').forEach(section => {
                section.classList.remove('show');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionName + '-section').classList.add('show');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
    }

    generateCSVReport(jsonReport) {
        const { results } = jsonReport;
        let csv = 'Category,ID,Name,Status,Duration,Message,Selector,Property,Expected,Actual\n';
        
        // 機能テスト
        results.functional.forEach(test => {
            csv += `Functional,${test.id},"${test.name}",${test.status},${test.duration},"${test.message || ''}",,,,,\n`;
        });
        
        // CSS検証
        results.css.forEach(test => {
            csv += `CSS,,"${test.description}",${test.isValid ? 'PASS' : 'FAIL'},,"${test.error || ''}",${test.selector},${test.property},"${test.expected}","${test.actual}"\n`;
        });
        
        // DOM検証
        results.dom.forEach(test => {
            csv += `DOM,,"${test.description}",${test.isValid ? 'PASS' : 'FAIL'},,"${test.error || ''}",${test.selector},${test.type},,\n`;
        });
        
        return csv;
    }

    generateMarkdownReport(jsonReport) {
        const { summary, recommendations } = jsonReport;
        
        return `# 🧪 Workflow Visualizer - 包括的テストレポート

## 📊 実行サマリー

| 項目 | 値 |
|------|-----|
| **全体成功率** | ${summary.overall.successRate} |
| **総テスト数** | ${summary.overall.total} |
| **成功テスト** | ${summary.overall.passed} |
| **失敗テスト** | ${summary.overall.failed} |
| **スキップテスト** | ${summary.overall.skipped} |
| **実行時間** | ${(summary.overall.executionTime / 1000).toFixed(1)}秒 |
| **生成日時** | ${new Date(jsonReport.metadata.generatedAt).toLocaleString('ja-JP')} |

## 📈 カテゴリ別結果

### 🔧 機能テスト
- **成功率**: ${summary.breakdown.functional.successRate}
- **成功**: ${summary.breakdown.functional.passed}件
- **失敗**: ${summary.breakdown.functional.failed}件
- **スキップ**: ${summary.breakdown.functional.skipped}件

### 🎨 CSS検証
- **成功率**: ${summary.breakdown.css.successRate}
- **成功**: ${summary.breakdown.css.passed}件
- **失敗**: ${summary.breakdown.css.failed}件

### 🏗️ DOM検証
- **成功率**: ${summary.breakdown.dom.successRate}
- **成功**: ${summary.breakdown.dom.passed}件
- **失敗**: ${summary.breakdown.dom.failed}件

${recommendations.length > 0 ? `
## 💡 改善推奨事項

${recommendations.map(rec => `
### ${rec.priority} - ${rec.category}
**問題**: ${rec.issue}

**推奨対策**: ${rec.recommendation}
`).join('')}
` : ''}

## 📋 詳細結果

### 失敗したテスト

${this.allResults.functional.filter(r => r.status === 'FAIL').length > 0 ? `
#### 機能テスト失敗
${this.allResults.functional.filter(r => r.status === 'FAIL').map(test => `
- **Test ${test.id}**: ${test.name}
  - エラー: ${test.message}
  - 実行時間: ${test.duration}ms
`).join('')}
` : ''}

${this.allResults.css.filter(r => !r.isValid).length > 0 ? `
#### CSS検証失敗
${this.allResults.css.filter(r => !r.isValid).map(test => `
- **${test.selector} ${test.property}**: ${test.description}
  - 期待値: \`${test.expected}\`
  - 実際値: \`${test.actual}\`
`).join('')}
` : ''}

${this.allResults.dom.filter(r => !r.isValid).length > 0 ? `
#### DOM検証失敗
${this.allResults.dom.filter(r => !r.isValid).map(test => `
- **${test.type}**: ${test.description}
  - セレクタ: \`${test.selector}\`
  - エラー: ${test.error || 'N/A'}
`).join('')}
` : ''}

---

*Generated by Claude Code Test Framework v${jsonReport.metadata.version}*
`;
    }

    printOverallSummary() {
        const { summary } = this.allResults;
        
        console.log('\n' + '='.repeat(80));
        console.log('🎯 WORKFLOW VISUALIZER - 包括的テスト結果サマリー');
        console.log('='.repeat(80));
        console.log(`📊 全体成功率: ${summary.overall.successRate} (${summary.overall.passed}/${summary.overall.total})`);
        console.log(`⏱️  総実行時間: ${(summary.overall.executionTime / 1000).toFixed(1)}秒`);
        console.log('');
        console.log('📈 カテゴリ別結果:');
        console.log(`   🔧 機能テスト: ${summary.breakdown.functional.successRate} (${summary.breakdown.functional.passed}/${summary.breakdown.functional.total})`);
        console.log(`   🎨 CSS検証: ${summary.breakdown.css.successRate} (${summary.breakdown.css.passed}/${summary.breakdown.css.total})`);
        console.log(`   🏗️  DOM検証: ${summary.breakdown.dom.successRate} (${summary.breakdown.dom.passed}/${summary.breakdown.dom.total})`);
        console.log('='.repeat(80));
        
        if (summary.overall.failed > 0) {
            console.log(`\n⚠️  ${summary.overall.failed}件のテストが失敗しました。詳細レポートを確認してください。`);
        } else {
            console.log('\n🎉 すべてのテストが成功しました！');
        }
    }
}

// スタンドアロン実行
async function main() {
    const reportGenerator = new ComprehensiveReportGenerator();
    
    try {
        await reportGenerator.runAllTests();
    } catch (error) {
        console.error('❌ 包括的テスト実行に失敗:', error);
        process.exit(1);
    }
}

// モジュールとしてもスタンドアロンとしても使用可能
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ComprehensiveReportGenerator };