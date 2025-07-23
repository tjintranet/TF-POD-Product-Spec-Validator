# T&F Multi-File XML Validator

A web-based application for validating XML files against Taylor & Francis publishing specifications. This tool allows users to validate multiple XML files simultaneously, checking for correct paper weight, binding type, dimensions, and color specifications. The application now includes advanced filtering capabilities to organize results by XML generator for targeted reporting.

## Features

- **Drag & Drop Interface**: Easy-to-use interface for uploading multiple XML files
- **Batch Processing**: Process multiple XML files simultaneously
- **Real-time Validation**: Instant feedback on validation results
- **Generator Filtering**: Filter results by XML generator for targeted reporting
- **Detailed Reports**: Comprehensive validation reports for each file
- **Flexible Export Options**: Download filtered or complete validation results
- **Clipboard Support**: Copy individual validation results to clipboard
- **Responsive Design**: Works on both desktop and mobile devices
- **Generator Information**: Displays who generated each XML file

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

## Generator Filtering Features

### Automatic Filter Detection
- Filter options appear automatically when files from multiple generators are detected
- Clean interface when only one generator is present (no unnecessary filter UI)

### Filter Interface
- **Generator Badges**: Clickable filter buttons showing generator names and file counts
- **Active State**: Visual indication of currently selected filter
- **Clear Filter**: Easy option to reset and view all results
- **Filter Summary**: Text indicator showing current filter status

### Smart Results Display
- **Summary Statistics**: Shows total files, currently displayed files, passed, and failed counts
- **Dynamic Filtering**: Results instantly update when filters are applied
- **Preserved Functionality**: All existing features work seamlessly with filtering

## Export and Reporting

### Flexible Download Options
The application now provides multiple export options:

#### Filtered Reports
- **Detailed Report (Filtered)**: Complete validation details for currently filtered results
- **Summary Report (Filtered)**: Condensed view of filtered results with failed tests highlighted

#### Complete Reports
- **All Results - Detailed**: Complete validation details for all processed files
- **All Results - Summary**: Condensed view of all results regardless of current filter

### Enhanced Report Content
Reports now include:
- **Filter Status**: Clear indication if report is filtered or complete
- **Generator Breakdown**: Statistics showing file counts and success rates by generator
- **Enhanced Metadata**: Generator information, filter status, and comprehensive statistics
- **Targeted Filenames**: Filtered reports include generator name in filename for easy identification

### Report Naming Convention
- Filtered reports: `validation_detailed_report_2025-07-23_John_Smith.txt`
- Complete reports: `validation_detailed_report_2025-07-23.txt`
- Generator names are sanitized for file system compatibility

## Workflow for Multiple Generators

### Typical Usage Scenario
1. **Upload Mixed Files**: Process XML files from multiple team members simultaneously
2. **Review Overall Results**: See summary statistics for all files and generators
3. **Filter by Generator**: Click on a generator's name to view only their files
4. **Generate Targeted Reports**: Download filtered reports for specific generators
5. **Send Feedback**: Distribute relevant validation results to each originator
6. **Monitor Performance**: Use complete reports to track overall team performance

### Quality Management Benefits
- **Individual Accountability**: Track validation success rates by generator
- **Targeted Communication**: Send only relevant results to each team member
- **Trend Analysis**: Monitor improvements or issues by specific generators
- **Efficient Workflow**: Process all files together while maintaining individual reporting

## Technical Details

### Dependencies

- Bootstrap 5.3.2
- Bootstrap Icons 1.11.3
- Modern browser with File API support

### File Structure

- `index.html`: Main application interface with filter controls
- `style.css`: Custom styling including filter UI components
- `config.js`: Configuration settings and validation rules
- `validator.js`: Core validation logic
- `multi-validator.js`: File handling, filtering logic, and UI interactions

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
- Generator information extraction

#### Multi-validator (multi-validator.js)
Handles:
- File upload and processing
- Generator filtering logic
- Results display and filtering
- Text report generation (filtered and complete)
- Clipboard operations
- Generator information display and management

## Usage

1. **Upload Files**:
   - Drag and drop XML files onto the upload area
   - Or click "Browse Files" to select files manually

2. **View Results**:
   - Results are displayed immediately after processing
   - Each file gets a card showing validation status and details
   - Green indicates pass, red indicates failure
   - Generator information appears at the bottom of each card

3. **Filter Results** (when multiple generators are present):
   - Click on generator badges to filter results
   - View file counts for each generator
   - Use "Clear Filter" to reset view
   - Summary statistics update dynamically

4. **Export Results**:
   - Choose between filtered or complete reports
   - Select detailed or summary format
   - Reports include generator breakdown and filter status
   - Files are automatically named with timestamps and generator info

5. **Copy Results**:
   - Use "Copy to Clipboard" button on individual results
   - Copies formatted text matching the onscreen display
   - Includes generator information in the copied text

## Report Types

### Detailed Report
- Shows all validation tests for each file with ✓/✗ indicators
- Complete validation messages for each test
- Generator information for accountability
- Professional formatting with clear section separators
- Summary statistics at the top
- Generator breakdown section (when not filtered)

### Summary Report
- Overview statistics for each file (passed/failed test counts)
- Shows only failed tests for quick issue identification
- Generator information when available
- Condensed format for easier scanning
- Success rate calculations
- Filter status clearly indicated

## Report Format

Text reports feature:
- 80-character width professional layout
- Clear section headers and separators using ASCII characters
- Summary statistics with total files, passed, failed, and success rates
- Generator breakdown with individual statistics
- Visual indicators (✓ for pass, ✗ for fail)
- Generator information display for each file
- Filter status and metadata
- Timestamp and report type identification
- Plain text format for universal compatibility and easy sharing

## Error Handling

- Invalid XML format detection
- Missing required field identification
- Incompatible specification alerts
- File processing error reporting
- Missing or invalid generator information handled gracefully
- Filter state management with error recovery

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
- Smart filter UI rendering (only when needed)
- Minimal overhead for single-generator scenarios

## Styling

The application uses a combination of:
- Bootstrap classes for layout and components
- Custom CSS for animations and visual feedback
- Responsive design principles
- Consistent color scheme for status indication
- Subtle styling for generator information
- Modern filter UI with hover effects and active states

## Future Enhancements

Potential areas for improvement:
1. Advanced filtering options (date ranges, validation status)
2. Export to additional formats (PDF, Excel)
3. Email integration for automated report distribution
4. Historical tracking and trend analysis
5. Custom validation rule configuration
6. Bulk actions on filtered results
7. Generator performance dashboards
8. Integration with project management tools