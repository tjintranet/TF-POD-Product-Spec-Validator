// Initialize validator
const validator = new SpecificationValidator();

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const progressBar = document.getElementById('progressBar');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');

// Clear results function
function clearResults() {
    results.innerHTML = '<p class="text-muted">Upload an XML file to see validation results.</p>';
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
    errorAlert.classList.add('d-none');
    errorMessage.innerHTML = '';
    progressBar.style.display = 'none';
    progressBar.querySelector('.progress-bar').style.width = '0%';
}

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
    handleFiles(e.dataTransfer.files);
});

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
        <strong>File:</strong> ${file.name}<br>
        <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB
    `;

    // Show and update progress bar
    progressBar.style.display = 'block';
    const progress = progressBar.querySelector('.progress-bar');
    progress.style.width = '0%';

    const reader = new FileReader();
    
    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const percentage = (e.loaded / e.total) * 100;
            progress.style.width = percentage + '%';
        }
    };

    reader.onload = (e) => {
        progress.style.width = '100%';
        setTimeout(() => {
            validateXML(e.target.result, file.name);
        }, 500);
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
        resultDiv.className = `alert ${result.result ? 'alert-success' : 'alert-danger'} fade-in`;
        resultDiv.style.animationDelay = `${index * 100}ms`;
        
        resultDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${result.result ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i>
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
    errorAlert.classList.add('error-shake');
    setTimeout(() => {
        errorAlert.classList.remove('error-shake');
    }, 820);
}