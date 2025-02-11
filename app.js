// Initialize validator
const validator = new SpecificationValidator();

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');
const clearBtn = document.getElementById('clearBtn');

// Clear results function
function clearResults() {
    results.innerHTML = '<p class="text-muted">Upload an XML file to see validation results.</p>';
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
    errorAlert.classList.add('d-none');
    errorMessage.innerHTML = '';
    fileInput.value = '';
}

// File input handler
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.xml')) {
        showError('Please upload an XML file');
        return;
    }

    // Show file info
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <div class="small">
            <strong>File:</strong> ${file.name}
        </div>
    `;

    const reader = new FileReader();
    
    reader.onload = (e) => {
        validateXML(e.target.result, file.name);
    };

    reader.onerror = () => {
        showError('Error reading file');
    };

    reader.readAsText(file);
}

function validateXML(xmlContent, fileName) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Invalid XML format');
        }

        const validationResults = validator.validate(xmlDoc, fileName);
        displayResults(validationResults);
    } catch (error) {
        showError('Error parsing XML: ' + error.message);
    }
}

function displayResults(validationResults) {
    results.innerHTML = '';
    
    validationResults.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = `alert ${result.result ? 'alert-success' : 'alert-danger'} mb-2`;
        
        resultDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${result.result ? 'bi-check-circle' : 'bi-x-circle'} me-2"></i>
                <div>
                    <strong>${result.test}:</strong> ${result.message}
                </div>
            </div>
        `;
        
        results.appendChild(resultDiv);
    });
}

function showError(message) {
    errorAlert.classList.remove('d-none');
    errorMessage.textContent = message;
    
    // Add and remove shake animation
    errorAlert.classList.add('error-shake');
    setTimeout(() => {
        errorAlert.classList.remove('error-shake');
    }, 820);
}