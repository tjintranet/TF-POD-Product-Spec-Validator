# T&F Multi-File XML Validator Configuration Guide

## Configuration Details (config.js)

The `config.js` file contains the core validation rules and specifications for the application. It exports a single `CONFIG` object that defines all validation parameters.

> **Note:** The validator operates on **raw (pre-transform) XML** — i.e. the source XML before any XSL transform is applied. Field values such as `version_type`, `grammage`, and `treatment` are therefore in their original long-form states (e.g. `Paperback`, `80gsm/50lb`, `Gloss laminate`).

---

### Page Extent

```javascript
PAGE_EXTENT: {
    MIN: 64,
    MAX_BY_GRAMMAGE: {
        '80gsm/50lb':  1040,
        '90gsm/60lb':  1320,
        '105gsm/70lb': 1320
    },
    DEFAULT_MAX: 1040
}
```

Page extent validation applies two checks:

- **Minimum**: Page count must be at least **64 pages**
- **Maximum**: Depends on paper weight:
  - `80gsm/50lb` — maximum **1040 pages**
  - `90gsm/60lb` — maximum **1320 pages**
  - `105gsm/70lb` — maximum **1320 pages**
  - Unknown grammage — falls back to **1040 pages**

Non-numeric or empty values are considered invalid.

---

### Valid Treatments

```javascript
VALID_TREATMENTS: new Set([
    'Gloss laminate',
    'Matt laminate'
])
```

Specifies valid cover treatment options in their pre-transform form:
- Only accepts `'Gloss laminate'` or `'Matt laminate'`
- Used for validating the `<treatment>` tag in the XML
- Case-sensitive matching
- Empty values or any other treatments are considered invalid

---

### Production Classes

```javascript
PRODUCTION_CLASSES: new Set([
    'Standard',
    'Premium',
    'Complex',
    'Premium Inkjet (Suitable)'
])
```

Valid values for the `<production_class>` tag:
- `Standard` — standard production workflow
- `Premium` — premium production workflow
- `Complex` — complex titles requiring special handling
- `Premium Inkjet (Suitable)` — titles suitable for premium inkjet printing

---

### Binding Map

```javascript
BINDING_MAP: {
    'Hardback': 'Cased',
    'Paperback': 'Limp',
    'Cased': 'Hardback',
    'Limp': 'Paperback'
}
```

Bidirectional mapping between publisher terminology (`Hardback`/`Paperback`) and specification terminology (`Cased`/`Limp`). The raw XML uses `Paperback`/`Hardback`; the validator normalises these to `Limp`/`Cased` when checking binding compatibility against paper weight.

---

### Paper Weight Specifications

```javascript
PAPER_WEIGHTS: {
    '80gsm/50lb': {
        dimensions_by_binding: {
            'Paperback': new Set([...]),  // 20 trim sizes
            'Hardback':  new Set([...])   // 19 trim sizes
        },
        colors:   new Set(['1']),
        bindings: new Set(['Cased', 'Limp'])
    },
    '90gsm/60lb': {
        dimensions: new Set([...]),       // 8 trim sizes
        colors:     new Set(['4', 'Scattercolor']),
        bindings:   new Set(['Cased', 'Limp'])
    },
    '105gsm/70lb': {
        dimensions: new Set([]),          // No dimension restrictions
        colors:     new Set(['4', 'Scattercolor']),
        bindings:   new Set(['Cased', 'Limp'])
    }
}
```

#### 80gsm/50lb Specifications
- **Dimensions**: Separate valid trim size sets per binding type. Paperback has 20 valid sizes; Hardback has 19. The key difference is `127x203`, which is valid for Paperback only.
  - Paperback: `123x186`, `127x203`, `129x198`, `138x216`, `140x216`, `148x210`, `152x229`, `156x234`, `165x235`, `169x244`, `170x240`, `171x246`, `172x216`, `174x246`, `178x254`, `189x246`, `191x235`, `204x254`, `210x280`, `210x297`
  - Hardback: same as above minus `127x203`
- **Color**: Mono only (`1`)
- **Bindings**: Both Cased and Limp

#### 90gsm/60lb Specifications
- **Dimensions**: 8 valid trim sizes — `129x198`, `138x216`, `152x229`, `156x234`, `174x246`, `178x254`, `210x280`, `210x297`
- **Color**: Full color (`4`) or `Scattercolor`
- **Bindings**: Both Cased and Limp

#### 105gsm/70lb Specifications
- **Dimensions**: No specific restrictions defined — all trim sizes pass dimension validation
- **Color**: Full color (`4`) or `Scattercolor`
- **Bindings**: Both Cased and Limp

---

### Implementation Notes

1. **Data Structure Choices**
   - Uses `Set` objects for O(1) lookup performance
   - Case-sensitive matching for reliability
   - `dimensions_by_binding` used for 80gsm to support binding-specific trim size rules
   - Empty `dimensions` set on 105gsm is treated as "no restriction" by the validator

2. **Validation Logic**
   - All dimensions are in millimeters (width × height)
   - Paper weight notation includes both GSM and LB equivalents
   - Color specifications are exact string matches
   - Treatment values must match exactly (pre-transform long form)
   - Page extent must be numeric, ≥ 64, and within the grammage-specific maximum

3. **Extensibility**
   - New paper weights can be added by extending the `PAPER_WEIGHTS` object
   - Use `dimensions` (flat Set) for weights with shared trim sizes across bindings
   - Use `dimensions_by_binding` (object of Sets keyed by `'Paperback'`/`'Hardback'`) for weights with binding-specific rules
   - Additional binding mappings can be included in `BINDING_MAP`
   - Page extent limits can be adjusted in `PAGE_EXTENT.MAX_BY_GRAMMAGE`

4. **Usage in Validation**
   ```javascript
   // Paper weight lookup
   const isValidWeight = CONFIG.PAPER_WEIGHTS.hasOwnProperty(grammage);

   // Dimension check — 80gsm uses per-binding sets
   const dimSet = CONFIG.PAPER_WEIGHTS['80gsm/50lb'].dimensions_by_binding[version_type];
   const isValidDimension = dimSet?.has(dimension);

   // Dimension check — 90gsm/105gsm use shared set
   const isValidDimension = CONFIG.PAPER_WEIGHTS['90gsm/60lb'].dimensions.has(dimension);

   // Other checks
   const isValidBinding   = CONFIG.PAPER_WEIGHTS[grammage]?.bindings.has(normalizedBinding);
   const isValidColor     = CONFIG.PAPER_WEIGHTS[grammage]?.colors.has(color);
   const isValidTreatment = CONFIG.VALID_TREATMENTS.has(treatment);

   // Page extent
   const maxPages = CONFIG.PAGE_EXTENT.MAX_BY_GRAMMAGE[grammage] ?? CONFIG.PAGE_EXTENT.DEFAULT_MAX;
   const isValidExtent = pageNum >= CONFIG.PAGE_EXTENT.MIN && pageNum <= maxPages;
   ```

---

### Error Handling

- Optional chaining (`?.`) prevents errors when grammage is unrecognised
- Set lookups return boolean values with no type coercion issues
- Page extent validation handles non-numeric values before range checks
- Dimension validation correctly returns false when `dimensions_by_binding` key is absent

---

### Maintenance Guidelines

When updating the configuration:
1. Maintain the existing structure for compatibility
2. Add new bindings to both sides of `BINDING_MAP`
3. Use consistent units (millimeters) for all dimensions
4. For a new paper weight with binding-specific dimension rules, use `dimensions_by_binding` with `'Paperback'`/`'Hardback'` keys
5. For a new paper weight with shared dimension rules, use a flat `dimensions` Set
6. Ensure treatment values match the pre-transform long form exactly (case-sensitive)
7. Update both `MAX_BY_GRAMMAGE` and `PAPER_WEIGHTS` when adding a new grammage
8. Test all combinations against real production XML files after making changes
