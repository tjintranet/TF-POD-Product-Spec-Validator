// NOTE: This validator operates on RAW (pre-transform) XML.
// version_type will be 'Paperback' or 'Hardback' (mapped to Limp/Cased via BINDING_MAP).
// grammage will be long-form: '80gsm/50lb', '90gsm/60lb', '105gsm/70lb'.
// treatment will be long-form: 'Gloss laminate' or 'Matt laminate'.

class SpecificationValidator {
    constructor() {
        this.validationSteps = [
            this.validateRequiredFields,
            this.validateProductionClass,
            this.validatePaperWeight,
            this.validateBinding,
            this.validateBindingStyle,
            this.validateDimensions,
            this.validateColor,
            this.validateTreatment,
            this.validatePageExtent
        ];
    }

    validate(xmlDoc) {
        const results = [];

        // Extract generator information (present in raw XML, stripped by transform)
        const firstName = xmlDoc.querySelector('xml_generated_by first_name')?.textContent?.trim() || '';
        const lastName  = xmlDoc.querySelector('xml_generated_by last_name')?.textContent?.trim()  || '';
        const generator = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : '';

        const context = {
            version_type:     xmlDoc.querySelector('version_type')?.textContent?.trim(),
            width:            xmlDoc.querySelector('format width')?.textContent?.trim(),
            height:           xmlDoc.querySelector('format height')?.textContent?.trim(),
            grammage:         xmlDoc.querySelector('parts text grammage')?.textContent?.trim(),
            colour:           xmlDoc.querySelector('parts text colour')?.textContent?.trim(),
            production_class: xmlDoc.querySelector('production_class')?.textContent?.trim(),
            treatment:        xmlDoc.querySelector('parts covers treatment')?.textContent?.trim(),
            page_extent:      xmlDoc.querySelector('page_extent')?.textContent?.trim(),
            binding_style:    xmlDoc.querySelector('binding style')?.textContent?.trim(),
            generator,
            results
        };

        for (const step of this.validationSteps) {
            step.call(this, context);
        }

        return results;
    }

    addResult(results, test, result, message) {
        results.push({ test, result, message });
    }

    validateRequiredFields(context) {
        const { version_type, width, height, grammage, colour, production_class,
                treatment, page_extent, binding_style, results } = context;

        const requiredFields = {
            'Binding Type':     version_type,
            'Width':            width,
            'Height':           height,
            'Paper Weight':     grammage,
            'Color':            colour,
            'Production Class': production_class,
            'Treatment':        treatment,
            'Page Extent':      page_extent,
            'Binding Style':    binding_style
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value || value.trim() === '')
            .map(([field]) => field);

        const allFieldsPresent = missingFields.length === 0;

        const errorMessage = missingFields.map(field =>
            `${field}: ${requiredFields[field] === undefined ? 'missing' : 'empty'}`
        ).join(', ');

        this.addResult(
            results,
            'Required Fields',
            allFieldsPresent,
            allFieldsPresent
                ? 'All required fields are present and have values'
                : `Required fields validation failed - ${errorMessage}`
        );
    }

    validateProductionClass(context) {
        const { production_class, results } = context;
        const isValid = CONFIG.PRODUCTION_CLASSES.has(production_class);
        this.addResult(
            results,
            'Production Class',
            isValid,
            isValid
                ? `Valid production class: ${production_class}`
                : `Invalid production class: ${production_class} (must be Standard, Premium, Complex, or Premium Inkjet (Suitable))`
        );
    }

    validatePaperWeight(context) {
        const { grammage, results } = context;
        const isValid = CONFIG.PAPER_WEIGHTS.hasOwnProperty(grammage);
        this.addResult(
            results,
            'Paper Weight',
            isValid,
            isValid
                ? `Valid paper weight: ${grammage}`
                : `Invalid paper weight: ${grammage} (expected 80gsm/50lb, 90gsm/60lb, or 105gsm/70lb)`
        );
    }

    validateBinding(context) {
        const { version_type, grammage, results } = context;
        // Pre-transform version_type is 'Paperback'/'Hardback' — normalise to Limp/Cased
        const normalizedBinding = CONFIG.BINDING_MAP[version_type] || version_type;
        const isValid = CONFIG.PAPER_WEIGHTS[grammage]?.bindings.has(normalizedBinding);
        this.addResult(
            results,
            'Binding Type',
            isValid,
            isValid
                ? `Valid binding: ${version_type} (${normalizedBinding})`
                : `Invalid binding: ${version_type} for ${grammage}`
        );
    }

    validateBindingStyle(context) {
        const { binding_style, results } = context;

        if (!binding_style) {
            this.addResult(results, 'Binding Style', false, 'Binding style is missing or empty');
            return;
        }

        const isValid = binding_style.startsWith('Limp') || binding_style.startsWith('Cased');
        this.addResult(
            results,
            'Binding Style',
            isValid,
            isValid
                ? `Valid binding style: ${binding_style}`
                : `Invalid binding style: ${binding_style} (must start with 'Limp' or 'Cased')`
        );
    }

    validateDimensions(context) {
        const { width, height, grammage, version_type, results } = context;
        const dimension = `${width}x${height}`;
        const pwConfig = CONFIG.PAPER_WEIGHTS[grammage];

        let isValid = false;

        if (pwConfig) {
            if (pwConfig.dimensions_by_binding) {
                // 80gsm: look up dimension set by pre-transform version_type (Paperback/Hardback)
                const dimSet = pwConfig.dimensions_by_binding[version_type];
                isValid = dimSet ? dimSet.has(dimension) : false;
            } else {
                // 90gsm / 105gsm: single shared dimension set
                // 105gsm has an empty set — treat as no dimension restrictions
                isValid = pwConfig.dimensions.size === 0
                    ? true
                    : pwConfig.dimensions.has(dimension);
            }
        }

        this.addResult(
            results,
            'Size Combination',
            isValid,
            isValid
                ? `Valid trim size: ${dimension}mm`
                : `Invalid trim size: ${dimension}mm for ${grammage} ${version_type}`
        );
    }

    validateColor(context) {
        const { colour, grammage, results } = context;
        const isValid = CONFIG.PAPER_WEIGHTS[grammage]?.colors.has(colour);
        this.addResult(
            results,
            'Color Compatibility',
            isValid,
            isValid
                ? `Valid color: ${colour}`
                : `Invalid color '${colour}' for ${grammage}`
        );
    }

    validateTreatment(context) {
        const { treatment, results } = context;

        if (!treatment) {
            this.addResult(results, 'Treatment', false, 'Treatment is missing or empty');
            return;
        }

        const isValid = CONFIG.VALID_TREATMENTS.has(treatment);
        this.addResult(
            results,
            'Treatment',
            isValid,
            isValid
                ? `Valid treatment: ${treatment}`
                : `Invalid treatment: '${treatment}' (must be 'Gloss laminate' or 'Matt laminate')`
        );
    }

    validatePageExtent(context) {
        const { page_extent, grammage, results } = context;

        if (!page_extent) {
            this.addResult(results, 'Page Extent', false, 'Page extent is missing or empty');
            return;
        }

        const pageNum = parseInt(page_extent);

        if (isNaN(pageNum)) {
            this.addResult(results, 'Page Extent', false,
                `Page extent is not a valid number: '${page_extent}'`);
            return;
        }

        // Minimum check
        if (pageNum < CONFIG.PAGE_EXTENT.MIN) {
            this.addResult(results, 'Page Extent', false,
                `Page extent too low: ${pageNum} (minimum ${CONFIG.PAGE_EXTENT.MIN} pages)`);
            return;
        }

        // Maximum check: grammage-specific where known, otherwise fallback
        const maxPages = CONFIG.PAGE_EXTENT.MAX_BY_GRAMMAGE[grammage]
                      ?? CONFIG.PAGE_EXTENT.DEFAULT_MAX;

        const isValid = pageNum <= maxPages;
        this.addResult(
            results,
            'Page Extent',
            isValid,
            isValid
                ? `Valid page extent: ${pageNum}`
                : `Page extent ${pageNum} exceeds maximum of ${maxPages} for ${grammage}`
        );
    }
}
