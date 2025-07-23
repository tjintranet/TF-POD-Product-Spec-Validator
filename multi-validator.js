// DOM Elements and Initial Setup
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsArea = document.getElementById('resultsArea');
const downloadDropBtn = document.getElementById('downloadDropBtn');
const downloadDetailedBtn = document.getElementById('downloadDetailedBtn');
const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
const downloadAllDetailedBtn = document.getElementById('downloadAllDetailedBtn');
const downloadAllSummaryBtn = document.getElementById('downloadAllSummaryBtn');
const clearBtn = document.getElementById('clearBtn');
const processingSpinner = document.getElementById('processingSpinner');
const resultsSummary = document.getElementById('resultsSummary');
const totalFilesEl = document.getElementById('totalFiles');
const totalShowingEl = document.getElementById('totalShowing');
const totalPassedEl = document.getElementById('totalPassed');
const totalFailedEl = document.getElementById('totalFailed');
const filterSection = document.getElementById('filterSection');
const generatorFilters = document.getElementById('generatorFilters');
const clearFilter = document.getElementById('clearFilter');
const filterSummary = document.getElementById('filterSummary');

// Store results and filter state
let validationResults = [];
let currentFilter = null;
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
        currentFilter = null;
        updateResultsDisplay();
        updateFilterSection();
        downloadDropBtn.disabled = true;
        clearBtn.disabled = true;
    });

    // Clear filter handler
    clearFilter.addEventListener('click', () => {
        currentFilter = null;
        updateResultsDisplay();
        updateFilterButtons();
    });

    // Download button handlers
    downloadDetailedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('detailed', true);
        }
    });

    downloadSummaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('summary', true);
        }
    });

    downloadAllDetailedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('detailed', false);
        }
    });

    downloadAllSummaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validationResults.length > 0) {
            downloadResults('summary', false);
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
        currentFilter = null; // Reset filter when new files are processed
        updateResultsDisplay();
        updateFilterSection();
        downloadDropBtn.disabled = false;
        clearBtn.disabled = false;
    }
}

// Get unique generators from results
function getUniqueGenerators() {
    const generators = new Set();
    validationResults.forEach(result => {
        if (result.generator && result.generator.trim()) {
            generators.add(result.generator.trim());
        }
    });
    return Array.from(generators).sort();
}

// Update filter section
function updateFilterSection() {
    const generators = getUniqueGenerators();
    
    if (generators.length <= 1) {
        filterSection.style.display = 'none';
        return;
    }
    
    filterSection.style.display = 'block';
    
    generatorFilters.innerHTML = generators.map(generator => {
        const count = validationResults.filter(r => r.generator === generator).length;
        return `
            <div class="col-auto">
                <div class="generator-filter-item badge bg-light text-dark border px-3 py-2" 
                     data-generator="${escapeHtml(generator)}">
                    ${escapeHtml(generator)} (${count})
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to filter buttons
    document.querySelectorAll('.generator-filter-item').forEach(button => {
        button.addEventListener('click', () => {
            const generator = button.getAttribute('data-generator');
            currentFilter = currentFilter === generator ? null : generator;
            updateResultsDisplay();
            updateFilterButtons();
        });
    });
    
    updateFilterButtons();
}

// Update filter button states
function updateFilterButtons() {
    document.querySelectorAll('.generator-filter-item').forEach(button => {
        const generator = button.getAttribute('data-generator');
        if (currentFilter === generator) {
            button.classList.add('active');
            button.classList.remove('bg-light', 'text-dark');
        } else {
            button.classList.remove('active');
            button.classList.add('bg-light', 'text-dark');
        }
    });
    
    // Update filter summary
    if (currentFilter) {
        const filteredCount = getFilteredResults().length;
        filterSummary.textContent = `Showing ${filteredCount} files generated by "${currentFilter}"`;
    } else {
        filterSummary.textContent = '';
    }
}

// Get filtered results
function getFilteredResults() {
    if (!currentFilter) {
        return validationResults;
    }
    return validationResults.filter(result => result.generator === currentFilter);
}

// Calculate summary statistics
function calculateSummary(useFilter = true) {
    const results = useFilter ? getFilteredResults() : validationResults;
    const total = results.length;
    const failed = results.filter(result => 
        result.validations.some(v => !v.result)
    ).length;
    
    return {
        total: validationResults.length,
        showing: total,
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
    totalShowingEl.textContent = summary.showing;
    totalPassedEl.textContent = summary.passed;
    totalFailedEl.textContent = summary.failed;

    // Update results cards
    resultsArea.innerHTML = validationResults
        .map((fileResult, index) => {
            const hasErrors = fileResult.validations.some(v => !v.result);
            const cardClass = hasErrors ? 'border-danger' : 'border-success';
            const headerClass = hasErrors ? 'bg-danger' : 'bg-success';
            const isbn = extractISBN(fileResult.fileName);
            
            // Determine if this result should be shown based on filter
            const shouldShow = !currentFilter || fileResult.generator === currentFilter;
            const displayClass = shouldShow ? '' : 'filtered-out';
            
            return `
                <div class="col-12 ${displayClass}" data-file-index="${index}">
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

// Function to generate text report content
function generateTextReport(type = 'detailed', useFilter = true) {
    const results = useFilter ? getFilteredResults() : validationResults;
    if (results.length === 0) return '';
    
    const timestamp = new Date().toLocaleString();
    const summary = calculateSummary(useFilter);
    
    let report = '';
    
    // Header
    report += '='.repeat(80) + '\n';
    report += 'T&F XML VALIDATION REPORT\n';
    report += '='.repeat(80) + '\n';
    report += `Generated: ${timestamp}\n`;
    report += `Report Type: ${type === 'detailed' ? 'Detailed' : 'Summary'}\n`;
    
    if (useFilter && currentFilter) {
        report += `Filter: Generated by "${currentFilter}"\n`;
    }
    
    report += '\n';
    
    // Summary section
    report += 'SUMMARY\n';
    report += '-'.repeat(40) + '\n';
    
    if (useFilter && currentFilter) {
        report += `Filter Applied: Files by "${currentFilter}"\n`;
        report += `Total Files in System: ${validationResults.length}\n`;
        report += `Filtered Files Shown: ${summary.showing}\n`;
    } else {
        report += `Total Files Processed: ${summary.showing}\n`;
    }
    
    report += `Files Passed: ${summary.passed}\n`;
    report += `Files Failed: ${summary.failed}\n`;
    report += `Success Rate: ${summary.showing > 0 ? Math.round((summary.passed / summary.showing) * 100) : 0}%\n\n`;
    
    // Generator breakdown if not filtered
    if (!useFilter || !currentFilter) {
        const generators = getUniqueGenerators();
        if (generators.length > 1) {
            report += 'GENERATOR BREAKDOWN\n';
            report += '-'.repeat(40) + '\n';
            generators.forEach(generator => {
                const genResults = validationResults.filter(r => r.generator === generator);
                const genFailed = genResults.filter(r => r.validations.some(v => !v.result)).length;
                const genPassed = genResults.length - genFailed;
                report += `${generator}: ${genResults.length} files (${genPassed} passed, ${genFailed} failed)\n`;
            });
            report += '\n';
        }
    }
    
    // Individual file results
    report += 'VALIDATION RESULTS\n';
    report += '='.repeat(80) + '\n\n';
    
    results.forEach((fileResult, index) => {
        const isbn = extractISBN(fileResult.fileName);
        const hasErrors = fileResult.validations.some(v => !v.result);
        const status = hasErrors ? 'FAILED' : 'PASSED';
        
        report += `${index + 1}. ISBN: ${isbn}\n`;
        report += `   Status: ${status}\n`;
        
        if (fileResult.generator) {
            report += `   Generated by: ${fileResult.generator}\n`;
        }
        
        report += `   File: ${fileResult.fileName}\n`;
        report += '-'.repeat(80) + '\n';
        
        if (type === 'detailed') {
            // Show all validation details
            fileResult.validations.forEach(validation => {
                const statusIcon = validation.result ? '✓' : '✗';
                report += `   ${statusIcon} ${validation.test}: ${validation.message}\n`;
            });
        } else {
            // Show only summary information
            const totalTests = fileResult.validations.length;
            const passedTests = fileResult.validations.filter(v => v.result).length;
            const failedTests = totalTests - passedTests;
            
            report += `   Tests: ${passedTests}/${totalTests} passed`;
            if (failedTests > 0) {
                report += ` (${failedTests} failed)`;
            }
            report += '\n';
            
            // Show failed tests only
            const failedValidations = fileResult.validations.filter(v => !v.result);
            if (failedValidations.length > 0) {
                report += '   Failed Tests:\n';
                failedValidations.forEach(validation => {
                    report += `   ✗ ${validation.test}: ${validation.message}\n`;
                });
            }
        }
        
        report += '\n';
    });
    
    // Footer
    report += '='.repeat(80) + '\n';
    report += 'End of Report\n';
    report += '='.repeat(80) + '\n';
    
    return report;
}

// Function to download results as text report
function downloadResults(type = 'detailed', useFilter = true) {
    const results = useFilter ? getFilteredResults() : validationResults;
    if (results.length === 0) return;
    
    const reportContent = generateTextReport(type, useFilter);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    let filename = `validation_${type}_report_${timestamp}`;
    if (useFilter && currentFilter) {
        // Create a safe filename from the generator name
        const safeName = currentFilter.replace(/[^a-zA-Z0-9]/g, '_');
        filename += `_${safeName}`;
    }
    filename += '.txt';
    
    // Create and trigger download
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
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