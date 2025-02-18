# T&F Multi-File XML Validator

A web-based application for validating XML files against Taylor & Francis publishing specifications. This tool allows users to validate multiple XML files simultaneously, checking for correct paper weight, binding type, dimensions, and color specifications.

## Features

- **Drag & Drop Interface**: Easy-to-use interface for uploading multiple XML files
- **Batch Processing**: Process multiple XML files simultaneously
- **Real-time Validation**: Instant feedback on validation results
- **Detailed Reports**: Comprehensive validation reports for each file
- **Export Options**: Download validation results in CSV format
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

2. **Paper Weight Validation**: Validates against supported paper weights
   - 80gsm/50lb
   - 90gsm/60lb

3. **Binding Type Compatibility**: Checks if binding type is compatible with paper weight
   - Supports: Cased (Hardback)
   - Supports: Limp (Paperback)

4. **Dimension Validation**: Verifies if the trim size combination is valid for the specified paper weight
   - Multiple supported dimensions per paper weight
   - Dimensions are specified in millimeters

5. **Color Compatibility**: Ensures color specification matches paper weight requirements
   - Single color (1)
   - Four color (4)
   - Scattercolor options

6. **Treatment Validation**: Validates cover treatment specification
   - Must be either 'Gloss laminate' or 'Matt laminate'
   - Any other value or empty field is considered invalid

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

## Configuration Details (config.js)

The `config.js` file contains the core validation rules and specifications for the application. It exports a single `CONFIG` object that defines all validation parameters.

### Valid Treatments

```javascript
VALID_TREATMENTS: new Set([
    'Gloss laminate',
    'Matt laminate'
])
```

This configuration specifies the valid cover treatment options:
- Only accepts 'Gloss laminate' or 'Matt laminate'
- Used for validating the `<treatment>` tag in the XML
- Case-sensitive matching
- Empty values or any other treatments are considered invalid

### Binding Map

```javascript
BINDING_MAP: {
    'Hardback': 'Cased',
    'Paperback': 'Limp',
    'Cased': 'Hardback',
    'Limp': 'Paperback'
}
```

This bidirectional mapping handles different terminology for binding types:
- Converts between publisher terminology ('Hardback'/'Paperback') and specification terminology ('Cased'/'Limp')
- Allows for flexible input while maintaining consistent internal validation
- Supports both forward and reverse lookups

### Paper Weight Specifications

```javascript
PAPER_WEIGHTS: {
    '80gsm/50lb': {
        dimensions: Set([...]),
        colors: Set(['1']),
        bindings: Set(['Cased', 'Limp'])
    },
    '90gsm/60lb': {
        dimensions: Set([...]),
        colors: Set(['4', 'Scattercolor', '4 or Scattercolour']),
        bindings: Set(['Cased', 'Limp'])
    }
}
```

#### 80gsm/50lb Specifications
- **Supported Dimensions**: 24 different trim sizes including:
  - Standard sizes (e.g., '123x186', '127x203')
  - Academic sizes (e.g., '156x234', '178x254')
  - Large format sizes (e.g., '210x280', '216x279')
- **Color Options**: Single color only ('1')
- **Binding Options**: Both Cased and Limp bindings supported

#### 90gsm/60lb Specifications
- **Supported Dimensions**: 4 specific trim sizes:
  - '152x229'
  - '156x234'
  - '174x246'
  - '178x254'
- **Color Options**: 
  - Full color ('4')
  - Scattercolor
  - '4 or Scattercolour' (alternative spelling supported)
- **Binding Options**: Both Cased and Limp bindings supported

### Implementation Notes

1. **Data Structure Choices**
   - Uses `Set` objects for O(1) lookup performance
   - Immutable configuration prevents runtime modifications
   - Case-sensitive matching for reliability

2. **Validation Logic**
   - All dimensions are in millimeters
   - Paper weight notation includes both GSM and LB equivalents
   - Color specifications are exact string matches
   - Treatment values must match exactly

3. **Extensibility**
   - New paper weights can be added by extending the `PAPER_WEIGHTS` object
   - Additional binding mappings can be included in `BINDING_MAP`
   - Additional treatments can be added to `VALID_TREATMENTS`
   - Structure supports future addition of new validation parameters

4. **Usage in Validation**
   ```javascript
   // Example validation checks
   const isValidDimension = CONFIG.PAPER_WEIGHTS[paperWeight]?.dimensions.has(dimension);
   const isValidBinding = CONFIG.PAPER_WEIGHTS[paperWeight]?.bindings.has(bindingType);
   const isValidColor = CONFIG.PAPER_WEIGHTS[paperWeight]?.colors.has(color);
   const isValidTreatment = CONFIG.VALID_TREATMENTS.has(treatment);
   ```

### Error Handling

The configuration structure supports robust error handling:
- Optional chaining prevents errors with invalid paper weights
- Set lookups return boolean values (no type coercion issues)
- Clear separation between configuration and validation logic
- Treatment validation fails gracefully for undefined values

### Maintenance Guidelines

When updating the configuration:
1. Maintain the existing structure for compatibility
2. Add new bindings to both sides of the binding map
3. Use consistent units (millimeters) for dimensions
4. Document any new color or binding terminology
5. Ensure treatment values match exactly (case-sensitive)
6. Test all combinations after making changes