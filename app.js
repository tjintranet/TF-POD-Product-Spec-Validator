const validator = new SpecificationValidator();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const progressBar = document.getElementById('progressBar');
const progressBarInner = progressBar.querySelector('.progress-bar');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');

function updateProgress(percent) {
    progressBar.style.display = 'flex';
    progressBarInner.style.width = `${percent}%`;
    if (percent === 100) {
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressBarInner.style.width = '0%';
        }, 1000);
    }
}

function showFileInfo(file) {
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <div class="text-muted">
            <small>
                <strong>File:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
                <strong>Type:</strong> ${file.type || 'text/xml'}
            </small>
        </div>
    `;
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    dropZone.classList.add('error-shake');
    setTimeout(() => dropZone.classList.remove('error-shake'), 1000);
}

function hideError() {
    errorAlert.classList.add('d-none');
}

function validateFile(file) {
    hideError();
    
    if (file.size > MAX_FILE_SIZE) {
        showError(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return false;
    }
    
    if (!file.type.includes('xml') && !file.name.endsWith('.xml')) {
        showError('Please upload an XML file');
        return false;
    }
    
    return true;
}

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
    const file = e.dataTransfer.files[0];
    if (validateFile(file)) {
        processFile(file);
        showFileInfo(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
        processFile(file);
        showFileInfo(file);
    }
});

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    results.forEach((result, index) => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${result.result ? 'success' : 'danger'} mb-2 fade-in`;
        alert.style.animationDelay = `${index * 0.1}s`;
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    ${result.result ? 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>' : 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>'
                    }
                </div>
                <div>
                    <strong>${result.test}:</strong> ${result.message}
                </div>
            </div>
        `;
        resultsDiv.appendChild(alert);
    });
}

function processFile(file) {
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const percentLoaded = Math.round((e.loaded / e.total) * 100);
            updateProgress(percentLoaded);
        }
    };

    reader.onload = (e) => {
        updateProgress(100);
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                displayResults([{
                    test: 'XML Parsing',
                    result: false,
                    message: 'Invalid XML format'
                }]);
                return;
            }

            const results = validator.validate(xmlDoc, file.name);
            displayResults(results);
        } catch (error) {
            displayResults([{
                test: 'Processing Error',
                result: false,
                message: error.message
            }]);
        }
    };

    reader.onerror = () => {
        displayResults([{
            test: 'File Reading',
            result: false,
            message: 'Error reading file'
        }]);
    };

    reader.readAsText(file);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});