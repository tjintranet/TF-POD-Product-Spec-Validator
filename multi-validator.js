// DOM Elements
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

// Initialize validator
const validator = new SpecificationValidator();

// Store results
let validationResults = [];

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
        .map((fileResult) => {
            const hasErrors = fileResult.validations.some(v => !v.result);
            const cardClass = hasErrors ? 'border-danger' : 'border-success';
            const headerClass = hasErrors ? 'bg-danger' : 'bg-success';
            const isbn = extractISBN(fileResult.fileName);
            
            return `
                <div class="col-12">
                    <div class="card validation-card ${cardClass} mb-3">
                        <div class="card-header ${headerClass} text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${escapeHtml(isbn)}</h5>
                            <span class="badge bg-white text-${hasErrors ? 'danger' : 'success'}">
                                ${hasErrors ? 'Failed' : 'Passed'}
                            </span>
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
    const csvRows = [];
    
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
        csvRows.push(['ISBN', 'Status', 'Summary']);
        
        validationResults.forEach(fileResult => {
            const hasErrors = fileResult.validations.some(v => !v.result);
            const status = hasErrors ? 'Failed' : 'Passed';
            const summary = hasErrors 
                ? `Failed ${fileResult.validations.filter(v => !v.result).length} validations`
                : 'All validations passed';
            const isbn = extractISBN(fileResult.fileName);
            
            csvRows.push([
                isbn,
                status,
                summary
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
    
    link.setAttribute('href', url);
    link.setAttribute('download', type === 'detailed' ? 'validation_results_detailed.csv' : 'validation_results_summary.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Function to handle file processing
async function handleFiles(files) {
    processingSpinner.style.display = 'block';
    validationResults = []; // Clear previous results
    
    for (const file of files) {
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
    }

    updateResultsDisplay();
    processingSpinner.style.display = 'none';
    downloadDropBtn.disabled = false;
    clearBtn.disabled = false;
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
    downloadResults('detailed');
});

downloadSummaryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadResults('minimal');
});