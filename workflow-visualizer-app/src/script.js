// Workflow Visualizer Client-Side JavaScript
// �����	p
let currentChart = null;
let currentData = [];

// DOM����Bn
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    showStatusMessage('Workflow Visualizer ready');
});

// �������n
function initializeEventListeners() {
    // Visualizeܿ�
    document.getElementById('visualize-btn').addEventListener('click', handleVisualize);
    
    // Exportܿ�
    document.getElementById('export-btn').addEventListener('click', exportInsights);
    
    // ա�������
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    
    // ƭ�Ȩ�e�
    document.getElementById('log-input').addEventListener('input', handleTextInput);
}

// Visualizeܿ��ï�
async function handleVisualize() {
    try {
        showStatusMessage('Processing data...');
        
        const data = getCurrentData();
        if (!data) {
            showError('No data provided');
            return;
        }

        // ����������
        if (!validateLogData(data)) {
            return;
        }

        // ����k����
        const response = await fetch('/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
            showError(result.error);
            return;
        }

        // ����\
        createChart(data);
        
        // ���֗
        await loadInsights();
        
        showSuccess('Visualization created successfully');
        
    } catch (error) {
        console.error('Visualization error:', error);
        showError(`Failed to create visualization: ${error.message}`);
    }
}

// �(n���֗
function getCurrentData() {
    const textInput = document.getElementById('log-input').value.trim();
    const fileInput = document.getElementById('file-upload');
    
    if (textInput) {
        try {
            return JSON.parse(textInput);
        } catch (error) {
            showError('Invalid JSON format in text area');
            return null;
        }
    }
    
    return null;
}

// ա��������
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        showError('Please select a JSON file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('log-input').value = JSON.stringify(data, null, 2);
            showSuccess('File loaded successfully');
        } catch (error) {
            showError('Invalid JSON file');
        }
    };
    
    reader.onerror = function() {
        showError('Failed to read file');
    };
    
    reader.readAsText(file);
}

// ƭ�Ȩ�e��
function handleTextInput(event) {
    const value = event.target.value.trim();
    if (value) {
        try {
            JSON.parse(value);
            hideError();
        } catch (error) {
            // �뿤�g����h:WjDe�-jng	
        }
    }
}

// ����������
function validateLogData(data) {
    if (!data) {
        showError('Invalid: No data provided');
        return false;
    }

    if (!Array.isArray(data)) {
        showError('Invalid: Data must be an array');
        return false;
    }

    if (data.length === 0) {
        showError('Invalid: No data provided');
        return false;
    }

    if (data.length > 50) {
        showError('Limit exceeded: Maximum 50 steps allowed');
        return false;
    }

    // ����n�������
    for (let i = 0; i < data.length; i++) {
        const step = data[i];
        
        if (!validateStepData(step, i)) {
            return false;
        }
    }

    currentData = data;
    return true;
}

// ��������������
function validateStepData(step, index) {
    const requiredFields = ['stepId', 'description', 'timeSpent'];
    
    for (const field of requiredFields) {
        if (!(field in step)) {
            showError(`Invalid: Malformed log data - Missing ${field} in step ${index + 1}`);
            return false;
        }
    }

    if (typeof step.stepId !== 'number') {
        showError(`Invalid: Malformed log data - stepId must be a number in step ${index + 1}`);
        return false;
    }

    if (typeof step.description !== 'string' || step.description.trim() === '') {
        showError(`Invalid: Malformed log data - Invalid description in step ${index + 1}`);
        return false;
    }

    if (typeof step.timeSpent !== 'number' || step.timeSpent < 0) {
        showError(`Invalid: Malformed log data - Invalid timeSpent in step ${index + 1}`);
        return false;
    }

    // �׷��գ���n�������
    if ('error' in step && typeof step.error !== 'boolean') {
        showError(`Invalid: Malformed log data - error must be boolean in step ${index + 1}`);
        return false;
    }

    if ('trials' in step && (typeof step.trials !== 'number' || step.trials < 1)) {
        showError(`Invalid: Malformed log data - trials must be a positive number in step ${index + 1}`);
        return false;
    }

    return true;
}

// Chart.js ����\
function createChart(data) {
    const ctx = document.getElementById('workflowChart').getContext('2d');
    
    // �Xn���Ȓ4�
    if (currentChart) {
        currentChart.destroy();
    }

    // �������n��
    const chartData = prepareChartData(data);
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Workflow Timeline',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const step = data[dataIndex];
                            return `Step ${step.stepId}: ${step.description}`;
                        },
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const step = data[dataIndex];
                            const labels = [
                                `Time Spent: ${step.timeSpent} minutes`,
                                `Trials: ${step.trials || 1}`,
                                `Status: ${step.error ? 'Error' : 'Success'}`
                            ];
                            
                            if (step.error && step.errorTime) {
                                labels.push(`Error Time: ${step.errorTime} minutes`);
                            }
                            
                            if (step.resolution) {
                                labels.push(`Resolution: ${step.resolution}`);
                            }
                            
                            return labels;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Steps'
                    },
                    ticks: {
                        callback: function(value, index) {
                            return `Step ${data[index]?.stepId || index + 1}`;
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Time (minutes)'
                    },
                    beginAtZero: true
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const step = data[dataIndex];
                    showStepDetails(step);
                }
            }
        }
    });

    // ����@nϤ��
    highlightErrors(data);
    
    // ���������
    document.getElementById('chart-label').textContent = `Workflow Visualization (${data.length} steps)`;
}

// ���������
function prepareChartData(data) {
    const labels = data.map((step, index) => `Step ${step.stepId || index + 1}`);
    const timeData = data.map(step => step.timeSpent);
    const backgroundColors = data.map(step => step.error ? '#ff6b6b' : '#4ecdc4');
    const borderColors = data.map(step => step.error ? '#ff5252' : '#26a69a');
    
    // ��뵤�fL�pk�eO	
    const pointRadius = data.map(step => Math.min(5 + (step.trials || 1) * 2, 15));

    return {
        labels: labels,
        datasets: [{
            label: 'Time Spent (minutes)',
            data: timeData,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
            pointRadius: pointRadius,
            pointHoverRadius: pointRadius.map(r => r + 2)
        }]
    };
}

// ����@Ϥ��
function highlightErrors(data) {
    setTimeout(() => {
        data.forEach((step, index) => {
            if (step.error) {
                const chartContainer = document.querySelector('.chart');
                chartContainer.classList.add('error-highlight');
                
                setTimeout(() => {
                    chartContainer.classList.remove('error-highlight');
                }, 2000);
            }
        });
    }, 1200);
}

// ����s0h:
function showStepDetails(step) {
    const details = [
        `Step ID: ${step.stepId}`,
        `Description: ${step.description}`,
        `Time Spent: ${step.timeSpent} minutes`,
        `Trials: ${step.trials || 1}`,
        `Status: ${step.error ? 'Error' : 'Success'}`
    ];
    
    if (step.error && step.errorTime) {
        details.push(`Error Time: ${step.errorTime} minutes`);
    }
    
    if (step.resolution) {
        details.push(`Resolution: ${step.resolution}`);
    }
    
    // �zV��n�H
    if (step.error && !step.resolution) {
        const resolution = prompt('Add resolution for this error step:');
        if (resolution && resolution.trim()) {
            addResolution(step.stepId, resolution.trim());
        }
    } else {
        alert(details.join('\n'));
    }
}

// ��ȭ�
async function loadInsights() {
    try {
        const response = await fetch('/insights');
        if (!response.ok) {
            throw new Error(`Failed to load insights: ${response.status}`);
        }
        
        const insights = await response.json();
        displayInsights(insights);
        
    } catch (error) {
        console.error('Failed to load insights:', error);
        showError('Failed to load insights');
    }
}

// ���h:
function displayInsights(insights) {
    const insightsList = document.getElementById('insights-list');
    
    if (!insights || insights.length === 0) {
        insightsList.innerHTML = '<p>No insights available</p>';
        return;
    }
    
    const insightsHTML = insights.map(insight => {
        return `<div class="insight-item">
            <h4>${insight.title || 'Insight'}</h4>
            <p>${insight.description || insight.message || insight}</p>
            ${insight.recommendation ? `<p><strong>Recommendation:</strong> ${insight.recommendation}</p>` : ''}
        </div>`;
    }).join('');
    
    insightsList.innerHTML = insightsHTML;
}

// �zV��
async function addResolution(stepId, resolution) {
    try {
        const response = await fetch('/add-resolution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stepId: stepId,
                resolution: resolution
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to add resolution: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Resolution added successfully');
            
            // �(n������
            const stepIndex = currentData.findIndex(step => step.stepId === stepId);
            if (stepIndex !== -1) {
                currentData[stepIndex].resolution = resolution;
                createChart(currentData);
            }
            
            // ��ȍ��
            await loadInsights();
        } else {
            showError(result.error || 'Failed to add resolution');
        }
        
    } catch (error) {
        console.error('Add resolution error:', error);
        showError(`Failed to add resolution: ${error.message}`);
    }
}

// JSON������
async function exportInsights() {
    try {
        showStatusMessage('Preparing export...');
        
        const response = await fetch('/download');
        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // ��������\
        const a = document.createElement('a');
        a.href = url;
        a.download = `workflow-insights-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // ������
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess('Insights exported successfully');
        
    } catch (error) {
        console.error('Export error:', error);
        showError(`Export failed: ${error.message}`);
    }
}

// ���h:
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.opacity = '0';
    
    // է�ɤ�������
    setTimeout(() => {
        errorElement.style.transition = 'opacity 0.3s ease-in-out';
        errorElement.style.opacity = '1';
    }, 10);
    
    // ��g�Y
    setTimeout(() => {
        hideError();
    }, 5000);
    
    showStatusMessage(`Error: ${message}`);
}

// ���^h:
function hideError() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.transition = 'opacity 0.3s ease-in-out';
    errorElement.style.opacity = '0';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 300);
}

// ��û��h:
function showSuccess(message) {
    showStatusMessage(`Success: ${message}`);
    
    //  B�j�����
    const container = document.querySelector('.container');
    container.classList.add('success-flash');
    
    setTimeout(() => {
        container.classList.remove('success-flash');
    }, 1000);
}

// ������û�����������(	
function showStatusMessage(message) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    
    console.log(`Status: ${message}`);
}

// ��ƣ�ƣ�p
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

function calculateTotalTime(data) {
    return data.reduce((total, step) => total + step.timeSpent, 0);
}

function countErrors(data) {
    return data.filter(step => step.error).length;
}

function getAverageTrials(data) {
    const totalTrials = data.reduce((total, step) => total + (step.trials || 1), 0);
    return (totalTrials / data.length).toFixed(1);
}

// CSS �������(n��ƣ�ƣ
function addAnimationClass(element, className, duration = 1000) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

// ��ð(���p
function debugLog(message, data = null) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[Workflow Visualizer] ${message}`, data);
    }
}

// ��
debugLog('Workflow Visualizer script loaded');