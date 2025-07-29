/**
 * APIモックサーバー
 * Workflow Visualizer のバックエンドAPIをモックし、テスト環境を提供
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

class MockAPIServer {
    constructor(port = 3001) {
        this.app = express();
        this.port = port;
        this.uploadedData = null;
        this.insights = [];
        this.resolutions = new Map();
        this.requestLog = [];
        this.isRunning = false;
    }

    initialize() {
        console.log('🚀 Mock API Server を初期化中...');
        
        // ミドルウェアの設定
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // 静的ファイルの提供（テスト用）
        this.app.use('/static', express.static(path.join(__dirname, '../src')));
        
        // リクエストログ
        this.app.use((req, res, next) => {
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                body: req.method === 'POST' ? req.body : undefined
            };
            this.requestLog.push(logEntry);
            
            console.log(`📡 ${req.method} ${req.url} - ${req.ip}`);
            next();
        });
        
        this.setupRoutes();
        this.setupErrorHandling();
        
        console.log('✅ Mock API Server の初期化が完了しました');
    }

    setupRoutes() {
        // ヘルスチェック
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                requestsServed: this.requestLog.length
            });
        });

        // ワークフローデータのアップロード
        this.app.post('/upload', (req, res) => {
            try {
                const data = req.body;
                
                // バリデーション
                if (!Array.isArray(data)) {
                    return res.status(400).json({
                        error: 'Invalid data format: expected array'
                    });
                }
                
                if (data.length === 0) {
                    return res.status(400).json({
                        error: 'Invalid: No data provided'
                    });
                }
                
                if (data.length > 50) {
                    return res.status(400).json({
                        error: 'Limit exceeded: Maximum 50 steps allowed'
                    });
                }
                
                // 各ステップのバリデーション
                for (let i = 0; i < data.length; i++) {
                    const step = data[i];
                    const validationResult = this.validateStep(step, i);
                    
                    if (!validationResult.isValid) {
                        return res.status(400).json({
                            error: validationResult.error
                        });
                    }
                }
                
                // データの保存
                this.uploadedData = data;
                
                // 自動インサイト生成
                this.generateAutomaticInsights(data);
                
                res.json({
                    success: true,
                    message: 'Data uploaded successfully',
                    stepCount: data.length,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({
                    error: 'Internal server error during upload'
                });
            }
        });

        // インサイトの取得
        this.app.get('/insights', (req, res) => {
            try {
                res.json(this.insights);
            } catch (error) {
                console.error('Insights error:', error);
                res.status(500).json({
                    error: 'Failed to retrieve insights'
                });
            }
        });

        // 解決策の追加
        this.app.post('/add-resolution', (req, res) => {
            try {
                const { stepId, resolution } = req.body;
                
                if (!stepId || !resolution) {
                    return res.status(400).json({
                        error: 'stepId and resolution are required'
                    });
                }
                
                // XSS防止
                if (this.containsSuspiciousContent(resolution)) {
                    return res.status(400).json({
                        error: 'Invalid: Unsafe content detected'
                    });
                }
                
                // 解決策の保存
                this.resolutions.set(stepId, resolution);
                
                // インサイトリストに追加
                const insight = {
                    id: `resolution-${stepId}-${Date.now()}`,
                    title: `Resolution for Step ${stepId}`,
                    description: resolution,
                    stepId: stepId,
                    type: 'resolution',
                    createdAt: new Date().toISOString()
                };
                
                this.insights.push(insight);
                
                // アップロードされたデータにも解決策を追加
                if (this.uploadedData) {
                    const stepIndex = this.uploadedData.findIndex(step => step.stepId === stepId);
                    if (stepIndex !== -1) {
                        this.uploadedData[stepIndex].resolution = resolution;
                    }
                }
                
                res.json({
                    success: true,
                    message: 'Resolution added successfully',
                    insightId: insight.id
                });
                
            } catch (error) {
                console.error('Add resolution error:', error);
                res.status(500).json({
                    error: 'Failed to add resolution'
                });
            }
        });

        // データのダウンロード/エクスポート
        this.app.get('/download', (req, res) => {
            try {
                const exportData = {
                    metadata: {
                        exportedAt: new Date().toISOString(),
                        version: '1.0.0',
                        server: 'Mock API Server'
                    },
                    workflow: this.uploadedData,
                    insights: this.insights,
                    resolutions: Object.fromEntries(this.resolutions),
                    summary: this.generateSummary()
                };
                
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="workflow-insights.json"');
                res.json(exportData);
                
            } catch (error) {
                console.error('Download error:', error);
                res.status(500).json({
                    error: 'Failed to generate download'
                });
            }
        });

        // 管理用エンドポイント
        this.app.get('/admin/status', (req, res) => {
            res.json({
                server: {
                    status: 'running',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    requests: this.requestLog.length
                },
                data: {
                    hasUploadedData: !!this.uploadedData,
                    stepCount: this.uploadedData ? this.uploadedData.length : 0,
                    insightCount: this.insights.length,
                    resolutionCount: this.resolutions.size
                }
            });
        });

        this.app.get('/admin/requests', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            const recentRequests = this.requestLog.slice(-limit);
            res.json(recentRequests);
        });

        this.app.post('/admin/reset', (req, res) => {
            this.uploadedData = null;
            this.insights = [];
            this.resolutions.clear();
            
            res.json({
                success: true,
                message: 'Server data reset successfully'
            });
        });

        // テスト用エンドポイント
        this.app.get('/test/sample-data', (req, res) => {
            const sampleData = this.generateSampleWorkflow();
            res.json(sampleData);
        });

        this.app.post('/test/simulate-error', (req, res) => {
            const { errorType } = req.body;
            
            switch (errorType) {
                case 'timeout':
                    // タイムアウトをシミュレート
                    setTimeout(() => {
                        res.status(500).json({ error: 'Request timeout' });
                    }, 30000);
                    break;
                    
                case 'server_error':
                    res.status(500).json({ error: 'Internal server error' });
                    break;
                    
                case 'not_found':
                    res.status(404).json({ error: 'Not found' });
                    break;
                    
                default:
                    res.status(400).json({ error: 'Unknown error type' });
            }
        });

        // デフォルトルート
        this.app.get('/', (req, res) => {
            res.json({
                name: 'Workflow Visualizer Mock API Server',
                version: '1.0.0',
                status: 'running',
                endpoints: [
                    'POST /upload - Upload workflow data',
                    'GET /insights - Get insights',
                    'POST /add-resolution - Add resolution',
                    'GET /download - Download data',
                    'GET /health - Health check',
                    'GET /admin/status - Admin status',
                    'GET /test/sample-data - Get sample data'
                ]
            });
        });
    }

    setupErrorHandling() {
        // 404エラーハンドリング
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });

        // 一般的なエラーハンドリング
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        });
    }

    validateStep(step, index) {
        const requiredFields = ['stepId', 'description', 'timeSpent'];
        
        for (const field of requiredFields) {
            if (!(field in step)) {
                return {
                    isValid: false,
                    error: `Invalid: Malformed log data - Missing ${field} in step ${index + 1}`
                };
            }
        }
        
        if (typeof step.stepId !== 'number') {
            return {
                isValid: false,
                error: `Invalid: Malformed log data - stepId must be a number in step ${index + 1}`
            };
        }
        
        if (typeof step.description !== 'string' || step.description.trim() === '') {
            return {
                isValid: false,
                error: `Invalid: Malformed log data - Invalid description in step ${index + 1}`
            };
        }
        
        if (typeof step.timeSpent !== 'number' || step.timeSpent < 0) {
            return {
                isValid: false,
                error: `Invalid: Malformed log data - Invalid timeSpent in step ${index + 1}`
            };
        }
        
        if ('error' in step && typeof step.error !== 'boolean') {
            return {
                isValid: false,
                error: `Invalid: Malformed log data - error must be boolean in step ${index + 1}`
            };
        }
        
        if ('trials' in step && (typeof step.trials !== 'number' || step.trials < 1)) {
            return {
                isValid: false,
                error: `Invalid: Malformed log data - trials must be a positive number in step ${index + 1}`
            };
        }
        
        return { isValid: true };
    }

    containsSuspiciousContent(content) {
        const suspiciousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /vbscript:/i
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(content));
    }

    generateAutomaticInsights(data) {
        const insights = [];
        
        // 基本統計
        const totalTime = data.reduce((sum, step) => sum + step.timeSpent, 0);
        const errorSteps = data.filter(step => step.error);
        const averageTime = totalTime / data.length;
        const errorRate = (errorSteps.length / data.length) * 100;
        
        insights.push({
            id: `stat-total-time-${Date.now()}`,
            title: 'Workflow Duration',
            description: `Total workflow time: ${totalTime} minutes`,
            type: 'statistic',
            value: totalTime,
            createdAt: new Date().toISOString()
        });
        
        insights.push({
            id: `stat-avg-time-${Date.now()}`,
            title: 'Average Step Time',
            description: `Average time per step: ${averageTime.toFixed(1)} minutes`,
            type: 'statistic',
            value: averageTime,
            createdAt: new Date().toISOString()
        });
        
        if (errorSteps.length > 0) {
            insights.push({
                id: `stat-error-rate-${Date.now()}`,
                title: 'Error Rate',
                description: `${errorSteps.length} out of ${data.length} steps had errors (${errorRate.toFixed(1)}%)`,
                type: 'warning',
                value: errorRate,
                createdAt: new Date().toISOString()
            });
            
            // 最も時間がかかったエラーステップ
            const slowestErrorStep = errorSteps.reduce((max, step) => 
                step.timeSpent > max.timeSpent ? step : max
            );
            
            insights.push({
                id: `insight-slowest-error-${Date.now()}`,
                title: 'Longest Error Step',
                description: `Step ${slowestErrorStep.stepId} took ${slowestErrorStep.timeSpent} minutes and had an error`,
                type: 'recommendation',
                stepId: slowestErrorStep.stepId,
                createdAt: new Date().toISOString()
            });
        }
        
        // 長時間ステップの検出
        const longSteps = data.filter(step => step.timeSpent > averageTime * 2);
        if (longSteps.length > 0) {
            insights.push({
                id: `insight-long-steps-${Date.now()}`,
                title: 'Time-Consuming Steps',
                description: `${longSteps.length} steps took significantly longer than average`,
                type: 'optimization',
                steps: longSteps.map(s => s.stepId),
                createdAt: new Date().toISOString()
            });
        }
        
        // 試行回数の分析
        const stepsWithTrials = data.filter(step => step.trials && step.trials > 1);
        if (stepsWithTrials.length > 0) {
            const avgTrials = stepsWithTrials.reduce((sum, step) => sum + step.trials, 0) / stepsWithTrials.length;
            insights.push({
                id: `insight-trials-${Date.now()}`,
                title: 'Multiple Attempts',
                description: `${stepsWithTrials.length} steps required multiple attempts (avg: ${avgTrials.toFixed(1)})`,
                type: 'analysis',
                value: avgTrials,
                createdAt: new Date().toISOString()
            });
        }
        
        this.insights = insights;
    }

    generateSummary() {
        if (!this.uploadedData) return null;
        
        const data = this.uploadedData;
        return {
            stepCount: data.length,
            totalTime: data.reduce((sum, step) => sum + step.timeSpent, 0),
            errorCount: data.filter(step => step.error).length,
            averageTime: data.reduce((sum, step) => sum + step.timeSpent, 0) / data.length,
            averageTrials: data.reduce((sum, step) => sum + (step.trials || 1), 0) / data.length,
            resolutionCount: this.resolutions.size,
            insightCount: this.insights.length
        };
    }

    generateSampleWorkflow() {
        const sampleSteps = [
            { stepId: 1, description: "初期設定", timeSpent: 5, error: false, trials: 1 },
            { stepId: 2, description: "データ読み込み", timeSpent: 3, error: false, trials: 1 },
            { stepId: 3, description: "バリデーション", timeSpent: 8, error: true, trials: 2 },
            { stepId: 4, description: "データ変換", timeSpent: 6, error: false, trials: 1 },
            { stepId: 5, description: "保存処理", timeSpent: 4, error: false, trials: 1 }
        ];
        
        return sampleSteps;
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    this.isRunning = true;
                    console.log(`🌐 Mock API Server running on http://localhost:${this.port}`);
                    console.log(`📋 API endpoints available at http://localhost:${this.port}`);
                    resolve();
                });
                
                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.log(`⚠️  Port ${this.port} is already in use, trying ${this.port + 1}...`);
                        this.port += 1;
                        this.start().then(resolve).catch(reject);
                    } else {
                        reject(error);
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server && this.isRunning) {
                this.server.close(() => {
                    this.isRunning = false;
                    console.log('🛑 Mock API Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            hasData: !!this.uploadedData,
            requestCount: this.requestLog.length,
            insightCount: this.insights.length
        };
    }
}

// スタンドアロン実行
async function main() {
    const mockServer = new MockAPIServer();
    
    try {
        mockServer.initialize();
        await mockServer.start();
        
        console.log('\n✨ Mock API Server が正常に起動しました');
        console.log('📡 以下のエンドポイントが利用可能です:');
        console.log(`   • GET  http://localhost:${mockServer.port}/`);
        console.log(`   • POST http://localhost:${mockServer.port}/upload`);
        console.log(`   • GET  http://localhost:${mockServer.port}/insights`);
        console.log(`   • POST http://localhost:${mockServer.port}/add-resolution`);
        console.log(`   • GET  http://localhost:${mockServer.port}/download`);
        console.log(`   • GET  http://localhost:${mockServer.port}/health`);
        console.log('\n🔧 管理エンドポイント:');
        console.log(`   • GET  http://localhost:${mockServer.port}/admin/status`);
        console.log(`   • GET  http://localhost:${mockServer.port}/admin/requests`);
        console.log(`   • POST http://localhost:${mockServer.port}/admin/reset`);
        console.log('\n🧪 テスト用エンドポイント:');
        console.log(`   • GET  http://localhost:${mockServer.port}/test/sample-data`);
        console.log(`   • POST http://localhost:${mockServer.port}/test/simulate-error`);
        console.log('\nサーバーを停止するには Ctrl+C を押してください');
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down...');
            await mockServer.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Mock API Server:', error);
        process.exit(1);
    }
}

// モジュールとしてもスタンドアロンとしても使用可能
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MockAPIServer };