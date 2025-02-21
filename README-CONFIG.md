# T&F Multi-File XML Validator Configuration Guide

## Configuration Details (config.js)

The `config.js` file contains the core validation rules and specifications for the application. It exports a single `CONFIG` object that defines all validation parameters.

### Page Extent Limit

```javascript
MAX_PAGE_EXTENT: 1040
```

This configuration defines the maximum allowed page count:
- Maximum value for the `<page_extent>` tag in the XML
- Must be a positive integer
- Values exceeding this limit will fail validation
- Non-numeric values or empty fields are considered invalid

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
   - Page extent must be numeric and within limits

3. **Extensibility**
   - New paper weights can be added by extending the `PAPER_WEIGHTS` object
   - Additional binding mappings can be included in `BINDING_MAP`
   - Additional treatments can be added to `VALID_TREATMENTS`
   - Page extent limit can be adjusted via `MAX_PAGE_EXTENT`
   - Structure supports future addition of new validation parameters

4. **Usage in Validation**
   ```javascript
   // Example validation checks
   const isValidDimension = CONFIG.PAPER_WEIGHTS[paperWeight]?.dimensions.has(dimension);
   const isValidBinding = CONFIG.PAPER_WEIGHTS[paperWeight]?.bindings.has(bindingType);
   const isValidColor = CONFIG.PAPER_WEIGHTS[paperWeight]?.colors.has(color);
   const isValidTreatment = CONFIG.VALID_TREATMENTS.has(treatment);
   const isValidPageExtent = pageNum > 0 && pageNum <= CONFIG.MAX_PAGE_EXTENT;
   ```

### Error Handling

The configuration structure supports robust error handling:
- Optional chaining prevents errors with invalid paper weights
- Set lookups return boolean values (no type coercion issues)
- Clear separation between configuration and validation logic
- Treatment validation fails gracefully for undefined values
- Page extent validation handles non-numeric values safely

### Maintenance Guidelines

When updating the configuration:
1. Maintain the existing structure for compatibility
2. Add new bindings to both sides of the binding map
3. Use consistent units (millimeters) for dimensions
4. Document any new color or binding terminology
5. Ensure treatment values match exactly (case-sensitive)
6. Consider page extent limits carefully based on production capabilities
7. Test all combinations after making changes