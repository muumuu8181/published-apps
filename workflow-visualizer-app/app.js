const express = require('express');
const path = require('path');
const fs = require('fs');

// Express �������
const app = express();
const PORT = 3000;

// �������������
let workflowInsights = {
  timestamp: new Date().toISOString(),
  totalSteps: 0,
  totalTime: 0,
  errorSteps: 0,
  errorTime: 0,
  averageTrials: 0,
  steps: []
};

// ��릧�-�
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'src')));

// XSS�˿���p
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// HTML����עp
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// �������p
function validateLogData(logData) {
  if (!Array.isArray(logData)) {
    return { valid: false, error: "Invalid: Log data must be an array" };
  }
  
  if (logData.length === 0) {
    return { valid: false, error: "Invalid: No data provided" };
  }
  
  if (logData.length > 50) {
    return { valid: false, error: "Limit exceeded" };
  }
  
  for (const step of logData) {
    if (typeof step.stepId !== 'number' || 
        typeof step.description !== 'string' ||
        typeof step.timeSpent !== 'number' ||
        typeof step.error !== 'boolean' ||
        typeof step.errorTime !== 'number' ||
        typeof step.trials !== 'number') {
      return { valid: false, error: "Invalid: Malformed log data" };
    }
    
    // �S'��ï
    if (step.timeSpent < 0 || step.errorTime < 0 || step.trials < 1) {
      return { valid: false, error: "Invalid: Malformed log data" };
    }
  }
  
  return { valid: true };
}

// �����p
function calculateInsights(logData) {
  const totalSteps = logData.length;
  const totalTime = logData.reduce((sum, step) => sum + step.timeSpent, 0);
  const errorSteps = logData.filter(step => step.error).length;
  const errorTime = logData.reduce((sum, step) => sum + step.errorTime, 0);
  const averageTrials = logData.reduce((sum, step) => sum + step.trials, 0) / totalSteps;
  
  // �������n�˿��
  const sanitizedSteps = logData.map(step => ({
    stepId: step.stepId,
    description: escapeHtml(sanitizeInput(step.description)),
    timeSpent: step.timeSpent,
    error: step.error,
    errorTime: step.errorTime,
    trials: step.trials,
    resolution: step.resolution ? escapeHtml(sanitizeInput(step.resolution)) : ''
  }));
  
  return {
    timestamp: new Date().toISOString(),
    totalSteps,
    totalTime,
    errorSteps,
    errorTime,
    averageTrials: Math.round(averageTrials * 100) / 100,
    steps: sanitizedSteps
  };
}

// �����p
function logOperation(type, stepId = null, status = 'success') {
  console.log(`Operation: ${type}, Step: ${stepId || 'N/A'}, Result: ${status}`);
}

// API ���ݤ��

// 1. POST /upload - �����������
app.post('/upload', (req, res) => {
  try {
    const { logData } = req.body;
    
    // �������
    const validation = validateLogData(logData);
    if (!validation.valid) {
      logOperation('upload', null, 'validation_error');
      return res.status(400).json({ error: validation.error });
    }
    
    // ����
    workflowInsights = calculateInsights(logData);
    
    logOperation('upload', null, 'success');
    res.json({
      success: true,
      message: 'Log data uploaded successfully',
      insights: workflowInsights
    });
    
  } catch (error) {
    logOperation('upload', null, 'error');
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /insights - ������֗
app.get('/insights', (req, res) => {
  try {
    logOperation('insights', null, 'success');
    res.json(workflowInsights);
  } catch (error) {
    logOperation('insights', null, 'error');
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. POST /add-resolution - �zV��
app.post('/add-resolution', (req, res) => {
  try {
    const { stepId, resolution } = req.body;
    
    // �������
    if (typeof stepId !== 'number' || typeof resolution !== 'string') {
      logOperation('add-resolution', stepId, 'validation_error');
      return res.status(400).json({ error: 'Invalid stepId or resolution' });
    }
    
    // ����"
    const stepIndex = workflowInsights.steps.findIndex(step => step.stepId === stepId);
    if (stepIndex === -1) {
      logOperation('add-resolution', stepId, 'not_found');
      return res.status(404).json({ error: 'Step not found' });
    }
    
    // �zV��˿��Wf��
    const sanitizedResolution = escapeHtml(sanitizeInput(resolution));
    workflowInsights.steps[stepIndex].resolution = sanitizedResolution;
    workflowInsights.timestamp = new Date().toISOString();
    
    logOperation('add-resolution', stepId, 'success');
    res.json({
      success: true,
      message: 'Resolution added successfully',
      insights: workflowInsights
    });
    
  } catch (error) {
    logOperation('add-resolution', req.body?.stepId, 'error');
    console.error('Add resolution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET /download - JSONա��������
app.get('/download', (req, res) => {
  try {
    const filename = 'workflow_insights.json';
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    logOperation('download', null, 'success');
    res.json(workflowInsights);
    
  } catch (error) {
    logOperation('download', null, 'error');
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ��Ȩ��ݤ�� - index.html�M�
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
  } catch (error) {
    console.error('Root endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ����ï���ݤ��
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 �����
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ������������
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ����w�
const server = app.listen(PORT, () => {
  console.log(`Workflow Visualizer Server running on http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'src')}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});

// ������������
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// ������ƹ�(	
module.exports = app;