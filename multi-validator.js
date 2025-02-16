// DOM Elements and Initial Setup
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsArea = document.getElementById('resultsArea');
const downloadDropBtn = document.getElementById('downloadDropBtn');
const downloadDetailedBtn = document.getElementById('downloadDetailedBtn');
const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
const clearBtn = document.getElementById('clearBtn');
const processingSpinner = document.getElementById('processingSpinner');
const resultsSummary = document.getElementById('resultsSummary');
const totalFilesEl = document.getElementById('totalFiles');
const totalPassedEl = document.getElementById('totalPassed');
const totalFailedEl = document.getElementById('totalFailed');

// Store results
let validationResults = [];
let validator;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide spinner initially
    processingSpinner.style.display = 'none';
    
    // Initialize validator
    validator = new SpecificationValidator();

    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(file => 
            file.name.toLowerCase().endsWith('.xml')
        );
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.name.toLowerCase().endsWith('.xml')
        );
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', () => {
        validationResults = [];
        updateResultsDisplay();
        downloadDropBtn.disabled = true;
        clearBtn.disabled = true;
    });

    // Download button handlers
    downloadDetailedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('detailed');
        }
    });

    downloadSummaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('summary');
        }
    });
}

// Function to extract ISBN from filename
function extractISBN(filename) {
    if (!filename) return '';
    const match = filename.match(/^(978\d{10})/);
    return match ? match[1] : filename;
}

// Function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to escape CSV content
function escapeCSV(cell) {
    return String(cell).replace(/"/g, '""');
}

// Function to convert validation results to RTF
function convertToRTF(fileResult) {
    // Escape special RTF characters
    function escapeRTF(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\n/g, '\\par ')
            .replace(/[^\u0000-\u007F]/g, char => `\\u${char.charCodeAt(0)}`);
    }

    // Start with basic RTF header and color table
    let rtf = [
        '{\\rtf1\\ansi\\deff0',
        '{\\colortbl;\\red0\\green0\\blue0;\\red0\\green180\\blue0;\\red255\\green0\\blue0;}',
        '\\viewkind4\\uc1\\pard\\cf1'
    ];
    
    const hasErrors = fileResult.validations.some(v => !v.result);
    const isbn = extractISBN(fileResult.fileName);
    
    // Add the content
    rtf.push(
        `\\b Validation Results for ISBN: ${escapeRTF(isbn)}\\b0\\par`,
        `\\b Status: ${hasErrors ? '{\\cf3 Failed}' : '{\\cf2 Passed}'}\\b0\\par`,
        '\\b ----------------------------------------\\b0\\par'
    );
    
    // Add each validation result
    fileResult.validations.forEach(validation => {
        const symbol = validation.result ? '✓' : '✗';
        const color = validation.result ? '\\cf2' : '\\cf3';
        rtf.push(
            `${color} ${symbol} \\b ${escapeRTF(validation.test)}:\\b0 ${escapeRTF(validation.message)}\\par`
        );
    });
    
    rtf.push('\\b ----------------------------------------\\b0\\par', '}');
    
    return rtf.join('\n');
}

// Helper function to create plain text version as fallback
function createPlainTextVersion(fileResult) {
    const isbn = extractISBN(fileResult.fileName);
    const hasErrors = fileResult.validations.some(v => !v.result);
    
    let text = `Validation Results for ISBN: ${isbn}\n`;
    text += `Status: ${hasErrors ? 'Failed' : 'Passed'}\n`;
    text += '----------------------------------------\n';
    
    fileResult.validations.forEach(validation => {
        text += `${validation.result ? '✓' : '✗'} ${validation.test}: ${validation.message}\n`;
    });
    
    text += '----------------------------------------\n';
    return text;
}

// Function to copy RTF to clipboard
async function copyToClipboard(fileResult) {
    const plainTextContent = createPlainTextVersion(fileResult);
    
    try {
        // Try using the modern Clipboard API with just plain text
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(plainTextContent);
        } else {
            // Fallback for browsers that don't support the Clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = plainTextContent;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }

        // Show success feedback
        const button = document.querySelector(`[data-isbn="${extractISBN(fileResult.fileName)}"]`);
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check-circle"></i> Copied!';
        button.classList.remove('btn-outline-light');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-light');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please try again.');
    }
}

// Calculate summary statistics
function calculateSummary() {
    const total = validationResults.length;
    const failed = validationResults.filter(result => 
        result.validations.some(v => !v.result)
    ).length;
    
    return {
        total,
        passed: total - failed,
        failed
    };
}

// Function to read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

// Function to validate XML content
function validateXMLContent(xmlContent, fileName) {
    // Initialize validator if not already done
    if (!validator) {
        validator = new SpecificationValidator();
    }
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            return [{
                test: 'XML Format',
                result: false,
                message: 'Invalid XML format'
            }];
        }

        return validator.validate(xmlDoc, fileName);
    } catch (error) {
        return [{
            test: 'XML Processing',
            result: false,
            message: 'Error processing XML: ' + error.message
        }];
    }
}

// Function to update results display
function updateResultsDisplay() {
    if (validationResults.length === 0) {
        resultsArea.innerHTML = `
            <div class="col-12 text-center text-muted">
                <p>Upload XML files to see validation results</p>
            </div>
        `;
        resultsSummary.classList.add('d-none');
        return;
    }

    // Update summary
    resultsSummary.classList.remove('d-none');
    const summary = calculateSummary();
    totalFilesEl.textContent = summary.total;
    totalPassedEl.textContent = summary.passed;
    totalFailedEl.textContent = summary.failed;

    // Update results cards
    resultsArea.innerHTML = validationResults
        .map((fileResult, index) => {
            const hasErrors = fileResult.validations.some(v => !v.result);
            const cardClass = hasErrors ? 'border-danger' : 'border-success';
            const headerClass = hasErrors ? 'bg-danger' : 'bg-success';
            const isbn = extractISBN(fileResult.fileName);
            
            return `
                <div class="col-12" data-file-index="${index}">
                    <div class="card validation-card ${cardClass} mb-3">
                        <div class="card-header ${headerClass} text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${escapeHtml(isbn)}</h5>
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-outline-light btn-sm" 
                                        onclick="copyToClipboard(validationResults[${index}])"
                                        data-isbn="${escapeHtml(isbn)}">
                                    <i class="bi bi-clipboard"></i> Copy to Clipboard
                                </button>
                                <span class="badge bg-white text-${hasErrors ? 'danger' : 'success'}">
                                    ${hasErrors ? 'Failed' : 'Passed'}
                                </span>
                            </div>
                        </div>
                        <div class="card-body">
                            <ul class="card-validation-list">
                                ${fileResult.validations.map(validation => `
                                    <li class="d-flex align-items-center">
                                        <i class="bi ${validation.result ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2"></i>
                                        <div>
                                            <strong>${escapeHtml(validation.test)}:</strong> 
                                            ${escapeHtml(validation.message)}
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Function to download results
function downloadResults(type = 'detailed') {
    if (validationResults.length === 0) return;
    
    const csvRows = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (type === 'detailed') {
        // Detailed report
        csvRows.push(['ISBN', 'Test', 'Status', 'Message']);
        
        validationResults.forEach(fileResult => {
            const isbn = extractISBN(fileResult.fileName);
            fileResult.validations.forEach(validation => {
                csvRows.push([
                    isbn,
                    validation.test,
                    validation.result ? 'Success' : 'Error',
                    validation.message
                ]);
            });
        });
    } else {
        // Summary report
        csvRows.push(['ISBN', 'Status', 'Total Tests', 'Passed', 'Failed']);
        
        validationResults.forEach(fileResult => {
            const totalTests = fileResult.validations.length;
            const passedTests = fileResult.validations.filter(v => v.result).length;
            const failedTests = totalTests - passedTests;
            const status = failedTests > 0 ? 'Failed' : 'Passed';
            const isbn = extractISBN(fileResult.fileName);
            
            csvRows.push([
                isbn,
                status,
                totalTests,
                passedTests,
                failedTests
            ]);
        });
    }
    
    // Generate CSV content
    const csvContent = csvRows
        .map(row => row.map(cell => `"${escapeCSV(cell)}"`).join(','))
        .join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const filename = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `validation_results_${type}_${filename}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Function to handle file processing
async function handleFiles(files) {
    try {
        processingSpinner.style.display = 'block';
        validationResults = []; // Clear previous results
    } finally {
        processingSpinner.style.display = 'none';
    }

    const filePromises = files.map(async (file) => {
        try {
            const content = await readFileContent(file);
            const results = validateXMLContent(content, file.name);
            if (results && Array.isArray(results)) {
                validationResults.push({
                    fileName: file.name,
                    validations: results
                });
            }
        } catch (error) {
            console.error('Error processing file:', error);
            validationResults.push({
                fileName: file.name,
                validations: [{
                    test: 'File Processing',
                    result: false,
                    message: 'Error reading file: ' + error.message
                }]
            });
        }
    });

    try {
        await Promise.all(filePromises);

        updateResultsDisplay();
        downloadDropBtn.disabled = false;
        clearBtn.disabled = false;
    } catch (error) {
        console.error('Error in handleFiles:', error);
    }
}

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.name.toLowerCase().endsWith('.xml')
    );
    if (files.length > 0) {
        handleFiles(files);
    }
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(file => 
        file.name.toLowerCase().endsWith('.xml')
    );
    if (files.length > 0) {
        handleFiles(files);
    }
});

clearBtn.addEventListener('click', () => {
    validationResults = [];
    updateResultsDisplay();
    downloadDropBtn.disabled = true;
    clearBtn.disabled = true;
});

downloadDetailedBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validationResults.length > 0) {
        downloadResults('detailed');
    }
});

downloadSummaryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validationResults.length > 0) {
        downloadResults('summary');
    }
});