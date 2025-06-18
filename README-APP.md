# T&F Multi-File XML Validator

A web-based application for validating XML files against Taylor & Francis publishing specifications. This tool allows users to validate multiple XML files simultaneously, checking for correct paper weight, binding type, dimensions, and color specifications.

## Features

- **Drag & Drop Interface**: Easy-to-use interface for uploading multiple XML files
- **Batch Processing**: Process multiple XML files simultaneously
- **Real-time Validation**: Instant feedback on validation results
- **Detailed Reports**: Comprehensive validation reports for each file
- **Export Options**: Download validation results as formatted text reports
- **Clipboard Support**: Copy individual validation results to clipboard
- **Responsive Design**: Works on both desktop and mobile devices

## Validation Checks

The validator performs the following checks on each XML file:

1. **Required Fields**: Ensures all necessary fields are present
   - Binding Type
   - Width
   - Height
   - Paper Weight
   - Color
   - Treatment
   - Page Extent
   - Binding Style

2. **Paper Weight Validation**: Validates against supported paper weights
   - 80gsm/50lb
   - 90gsm/60lb

3. **Binding Type Compatibility**: Checks if binding type is compatible with paper weight
   - Supports: Cased (Hardback)
   - Supports: Limp (Paperback)

4. **Binding Style Validation**: Verifies that binding style starts with a valid prefix
   - Must start with 'Cased' or 'Limp'
   - Any other prefix is considered invalid

5. **Dimension Validation**: Verifies if the trim size combination is valid for the specified paper weight
   - Multiple supported dimensions per paper weight
   - Dimensions are specified in millimeters

6. **Color Compatibility**: Ensures color specification matches paper weight requirements
   - Single color (1)
   - Four color (4)
   - Scattercolor options

7. **Treatment Validation**: Validates cover treatment specification
   - Must be either 'Gloss laminate' or 'Matt laminate'
   - Any other value or empty field is considered invalid

8. **Page Extent Validation**: Verifies the page count is within acceptable limits
   - Must be a positive number
   - Must not exceed 1040 pages
   - Empty or non-numeric values are invalid

## Technical Details

### Dependencies

- Bootstrap 5.3.2
- Bootstrap Icons 1.11.3
- Modern browser with File API support

### File Structure

- `index.html`: Main application interface
- `style.css`: Custom styling and animations
- `config.js`: Configuration settings and validation rules
- `validator.js`: Core validation logic
- `multi-validator.js`: File handling and UI interactions

### Key Components

#### Configuration (config.js)
Contains mapping for:
- Binding type conversions
- Paper weight specifications
- Supported dimensions
- Color options
- Treatment options
- Page extent limits

#### Validator (validator.js)
Implements the `SpecificationValidator` class with methods for:
- Required field validation
- Paper weight validation
- Binding type validation
- Binding style validation
- Dimension validation
- Color compatibility checks
- Treatment validation
- Page extent validation

#### Multi-validator (multi-validator.js)
Handles:
- File upload and processing
- Results display
- Text report generation
- Clipboard operations

## Usage

1. **Upload Files**:
   - Drag and drop XML files onto the upload area
   - Or click "Browse Files" to select files manually

2. **View Results**:
   - Results are displayed immediately after processing
   - Each file gets a card showing validation status and details
   - Green indicates pass, red indicates failure

3. **Export Results**:
   - Click "Download Results" to export as formatted text reports
   - Choose between detailed or summary report types
   - Reports include professional formatting with headers and statistics
   - Files are named with current date stamp (e.g., `validation_detailed_report_2025-06-18.txt`)

4. **Copy Results**:
   - Use "Copy to Clipboard" button on individual results
   - Copies formatted text matching the onscreen display

## Report Types

### Detailed Report
- Shows all validation tests for each file
- Includes complete test results with ✓/✗ indicators
- Full validation messages for each test
- Generator information when available
- Professional formatting with clear section separators

### Summary Report
- Overview statistics for each file
- Shows only failed tests for quick issue identification
- Pass/fail counts and success rates
- Condensed format for easier scanning
- Generator information when available

## Error Handling

- Invalid XML format detection
- Missing required field identification
- Incompatible specification alerts
- File processing error reporting

## Browser Support

Requires modern browsers with support for:
- File API
- Drag and Drop API
- Clipboard API
- CSS Grid and Flexbox
- ES6+ JavaScript features

## Performance

- Asynchronous file processing
- Batch file handling
- Optimized DOM updates
- Efficient validation algorithms

## Styling

The application uses a combination of:
- Bootstrap classes for layout and components
- Custom CSS for animations and visual feedback
- Responsive design principles
- Consistent color scheme for status indication

## Report Format

Text reports feature:
- 80-character width professional layout
- Clear section headers and separators
- Summary statistics with success rates
- Visual indicators (✓ for pass, ✗ for fail)
- Generator information display
- Timestamp and report type identification
- Plain text format for universal compatibility

## Future Enhancements

Potential areas for improvement:
1. Additional export formats (PDF, RTF)
2. Additional validation rules
3. Custom validation rule configuration
4. Progress indicators for large file sets
5. Enhanced error reporting
6. Support for additional file formats
7. Email integration for report sharing