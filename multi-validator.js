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

// Function to read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            // Log the first few characters to debug
            console.log('File content starts with:', content.substring(0, 100));
            resolve(content);
        };
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
        // Ensure we have a string and it starts with <?xml
        if (typeof xmlContent !== 'string') {
            console.error('xmlContent is not a string:', typeof xmlContent);
            return {
                validations: [{
                    test: 'XML Format',
                    result: false,
                    message: 'Invalid XML content type'
                }],
                generator: ''
            };
        }

        // Log the start of the content for debugging
        console.log('XML Content starts with:', xmlContent.substring(0, 100));

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check if parsing was successful
        const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
        if (parseError) {
            console.log('XML Parse error:', parseError.textContent);
            return {
                validations: [{
                    test: 'XML Format',
                    result: false,
                    message: `Invalid XML format: ${parseError.textContent}`
                }],
                generator: ''
            };
        }

        // Get the product node
        const productNode = xmlDoc.getElementsByTagName('product')[0];
        if (!productNode) {
            return {
                validations: [{
                    test: 'XML Structure',
                    result: false,
                    message: 'Missing root product element'
                }],
                generator: ''
            };
        }

        // Extract generator information from the XML
        const firstName = productNode.querySelector('xml_generated_by first_name')?.textContent?.trim() || '';
        const lastName = productNode.querySelector('xml_generated_by last_name')?.textContent?.trim() || '';
        const generator = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : '';

        const validations = validator.validate(productNode);
        return {
            validations: validations,
            generator: generator
        };
    } catch (error) {
        console.error('Error processing XML:', error);
        return {
            validations: [{
                test: 'XML Processing',
                result: false,
                message: 'Error processing XML: ' + error.message
            }],
            generator: ''
        };
    }
}

// Function to handle file processing
async function handleFiles(files) {
    try {
        processingSpinner.style.display = 'block';
        validationResults = []; // Clear previous results

        const filePromises = files.map(async (file) => {
            try {
                console.log('Processing file:', file.name);
                const content = await readFileContent(file);
                
                // Verify the content is valid XML
                if (!content.trim().startsWith('<?xml')) {
                    console.error('File does not start with XML declaration:', file.name);
                    validationResults.push({
                        fileName: file.name,
                        validations: [{
                            test: 'XML Format',
                            result: false,
                            message: 'File does not contain valid XML content'
                        }],
                        generator: ''
                    });
                    return;
                }

                const result = validateXMLContent(content, file.name);
                if (result && result.validations) {
                    validationResults.push({
                        fileName: file.name,
                        validations: result.validations,
                        generator: result.generator
                    });
                }
            } catch (error) {
                console.error('Error processing file:', file.name, error);
                validationResults.push({
                    fileName: file.name,
                    validations: [{
                        test: 'File Processing',
                        result: false,
                        message: 'Error reading file: ' + error.message
                    }],
                    generator: ''
                });
            }
        });

        await Promise.all(filePromises);
        
    } finally {
        processingSpinner.style.display = 'none';
        updateResultsDisplay();
        downloadDropBtn.disabled = false;
        clearBtn.disabled = false;
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
                                <button class="btn btn-outline-light btn-sm copy-btn" 
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
                            <ul class="list-unstyled mb-0">
                                ${fileResult.validations.map(validation => `
                                    <li class="d-flex align-items-start mb-2">
                                        <i class="bi ${validation.result ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2 mt-1"></i>
                                        <div>
                                            <strong>${escapeHtml(validation.test)}:</strong> 
                                            ${escapeHtml(validation.message)}
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                            ${fileResult.generator ? `
                            <div class="mt-3 pt-2 border-top">
                                <small class="text-muted">Generated by: ${escapeHtml(fileResult.generator)}</small>
                            </div>
                            ` : ''}
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
        csvRows.push(['ISBN', 'Test', 'Status', 'Message', 'Generated By']);
        
        validationResults.forEach(fileResult => {
            const isbn = extractISBN(fileResult.fileName);
            fileResult.validations.forEach(validation => {
                csvRows.push([
                    isbn,
                    validation.test,
                    validation.result ? 'Success' : 'Error',
                    validation.message,
                    fileResult.generator || ''
                ]);
            });
        });
    } else {
        // Summary report
        csvRows.push(['ISBN', 'Status', 'Total Tests', 'Passed', 'Failed', 'Generated By']);
        
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
                failedTests,
                fileResult.generator || ''
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
    const filename = type === 'detailed' ? 'validation_details.csv' : 'validation_summary.csv';
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Function to copy results to clipboard
async function copyToClipboard(fileResult) {
    const isbn = extractISBN(fileResult.fileName);
    const hasErrors = fileResult.validations.some(v => !v.result);
    
    let text = `Validation Results for ISBN: ${isbn}\n`;
    text += `Status: ${hasErrors ? 'Failed' : 'Passed'}\n`;
    text += '----------------------------------------\n';
    
    fileResult.validations.forEach(validation => {
        text += `${validation.result ? '✓' : '✗'} ${validation.test}: ${validation.message}\n`;
    });
    
    text += '----------------------------------------\n';
    
    if (fileResult.generator) {
        text += `Generated by: ${fileResult.generator}\n`;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const button = document.querySelector(`[data-isbn="${isbn}"]`);
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check-circle"></i> Copied!';
        button.classList.remove('btn-outline-light');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-light');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please try again.');
    }
}