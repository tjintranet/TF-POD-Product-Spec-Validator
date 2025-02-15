# T&F Multi-File XML Validator

A web-based tool for validating multiple XML product specifications against T&F standards. This application supports batch processing of XML files and provides detailed validation feedback with downloadable reports.

## Features

- Multiple file upload support
- Drag-and-drop interface
- Real-time validation feedback
- Detailed and summary report downloads
- ISBN extraction from filenames
- Progress indicators
- Error handling
- Validation for:
  - Required fields
  - Paper weight compatibility
  - Binding types
  - Dimensions
  - Color specifications

## Project Structure

```
├── index.html          # Main application interface
├── config.js           # Validation rules configuration
├── validator.js        # Core validation logic
├── multi-validator.js  # Multi-file handling and UI logic
└── README.md          # Documentation
```

## Setup

1. Clone the repository or download the files
2. Place all files in a web server directory
3. No build process required - the application runs directly in the browser

### Dependencies

The application uses CDN-hosted libraries:
- Bootstrap 5.3.2
- Bootstrap Icons 1.11.3

## Usage

### Running the Application

1. Open `index.html` in a web browser through a web server
2. Upload XML files either by:
   - Dragging and dropping files onto the upload area
   - Clicking the "Browse Files" button
3. View validation results in real-time
4. Download reports as needed

### Validation Results

Results are displayed in two formats:
1. On-screen cards showing:
   - ISBN number (extracted from filename)
   - Pass/Fail status
   - Detailed validation messages
2. Downloadable reports:
   - Detailed Report (all validation results)
   - Summary Report (pass/fail status per file)

### File Requirements

XML files should follow this structure:
```xml
<version_type>binding_type</version_type>
<format>
    <width>dimension</width>
    <height>dimension</height>
</format>
<parts>
    <text>
        <grammage>paper_weight</grammage>
        <colour>color_spec</colour>
    </text>
</parts>
```

### Filename Format

Files should be named with the ISBN as a prefix:
- Format: `[ISBN]_additional_text.xml`
- Example: `9781234567890_raps_metadata.xml`

## Validation Rules

### Paper Weight Rules

Configured in `config.js`:
```javascript
PAPER_WEIGHTS: {
    '80gsm/50lb': {
        dimensions: new Set(['123x186', '127x203'...]),
        colors: new Set(['1']),
        bindings: new Set(['Cased', 'Limp'])
    },
    '90gsm/60lb': {
        dimensions: new Set(['152x229', '156x234'...]),
        colors: new Set(['4', 'Scattercolor']),
        bindings: new Set(['Cased', 'Limp'])
    }
}
```

### Binding Types

Mapping configured in `config.js`:
```javascript
BINDING_MAP: {
    'Hardback': 'Cased',
    'Paperback': 'Limp',
    'Cased': 'Hardback',
    'Limp': 'Paperback'
}
```

## Customization

### Adding New Paper Weight Rules

1. Edit `config.js`
2. Add new entry to `PAPER_WEIGHTS` object:
```javascript
'new_weight': {
    dimensions: new Set(['dimension1', 'dimension2']),
    colors: new Set(['color1', 'color2']),
    bindings: new Set(['binding1', 'binding2'])
}
```

### Adding New Validation Rules

1. Edit `validator.js`
2. Add new validation method:
```javascript
validateNewRule(context) {
    return this.addResult(
        context.results,
        'Rule Name',
        condition,
        message
    );
}
```
3. Register in `validationSteps` array

## Error Handling

The application handles:
- Invalid XML format
- Missing required fields
- File reading errors
- Invalid file types
- Network errors
- Validation rule failures

## Browser Support

Requires modern browsers with support for:
- FileReader API
- DOMParser
- ES6+ JavaScript features
- Drag and Drop API
