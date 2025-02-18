class SpecificationValidator {
    constructor() {
        this.validationSteps = [
            this.validateRequiredFields,
            this.validateProductionClass,  // New validation step
            this.validatePaperWeight,
            this.validateBinding,
            this.validateDimensions,
            this.validateColor
        ];
    }

    validate(xmlDoc) {
        const results = [];
        const context = {
            version_type: xmlDoc.querySelector('version_type')?.textContent?.trim(),
            width: xmlDoc.querySelector('format width')?.textContent?.trim(),
            height: xmlDoc.querySelector('format height')?.textContent?.trim(),
            grammage: xmlDoc.querySelector('parts text grammage')?.textContent?.trim(),
            colour: xmlDoc.querySelector('parts text colour')?.textContent?.trim(),
            production_class: xmlDoc.querySelector('production_class')?.textContent?.trim(),
            results: results
        };

        // Run all validation steps regardless of failures
        for (const step of this.validationSteps) {
            step.call(this, context);
        }

        return results;
    }

    addResult(results, test, result, message) {
        results.push({ test, result, message });
    }

    validateRequiredFields(context) {
        const { version_type, width, height, grammage, colour, production_class, results } = context;
        
        // Check each required field
        const requiredFields = {
            'Binding Type': version_type,
            'Width': width,
            'Height': height,
            'Paper Weight': grammage,
            'Color': colour,
            'Production Class': production_class
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value || value.trim() === '')  // Enhanced empty check
            .map(([field]) => field);

        const allFieldsPresent = missingFields.length === 0;

        // Create a more detailed error message
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

    // New validation method for Production Class
    validateProductionClass(context) {
        const { production_class, results } = context;
        if (!production_class) {
            this.addResult(
                results,
                'Production Class',
                false,
                'Production class is missing'
            );
            return;
        }
        this.addResult(
            results,
            'Production Class',
            CONFIG.PRODUCTION_CLASSES.has(production_class),
            CONFIG.PRODUCTION_CLASSES.has(production_class)
                ? `Valid production class: ${production_class}`
                : `Invalid production class: ${production_class} (must be Standard or Premium)`
        );
    }

    validatePaperWeight(context) {
        const { grammage, results } = context;
        if (!grammage) {
            this.addResult(
                results,
                'Paper Weight',
                false,
                'Paper weight is missing'
            );
            return;
        }
        this.addResult(
            results,
            'Paper Weight',
            CONFIG.PAPER_WEIGHTS.hasOwnProperty(grammage),
            CONFIG.PAPER_WEIGHTS.hasOwnProperty(grammage)
                ? `Valid paper weight: ${grammage}`
                : `Invalid paper weight: ${grammage}`
        );
    }

    validateBinding(context) {
        const { version_type, grammage, results } = context;
        if (!version_type || !grammage) {
            this.addResult(
                results,
                'Binding Type',
                false,
                !version_type ? 'Binding type is missing' : 'Paper weight is missing (required for binding validation)'
            );
            return;
        }
        const normalizedBinding = CONFIG.BINDING_MAP[version_type] || version_type;
        const isValid = CONFIG.PAPER_WEIGHTS[grammage]?.bindings.has(normalizedBinding.trim());
        
        this.addResult(
            results,
            'Binding Type',
            isValid,
            isValid 
                ? `Valid binding: ${normalizedBinding}`
                : `Invalid binding combination: ${normalizedBinding} for ${grammage}`
        );
    }

    validateDimensions(context) {
        const { width, height, grammage, results } = context;
        if (!width || !height || !grammage) {
            this.addResult(
                results,
                'Size Combination',
                false,
                !width || !height 
                    ? 'Dimensions are missing'
                    : 'Paper weight is missing (required for dimension validation)'
            );
            return;
        }
        const dimension = `${width}x${height}`;
        const isValid = CONFIG.PAPER_WEIGHTS[grammage]?.dimensions.has(dimension);
        
        this.addResult(
            results,
            'Trim Size Batch Validation',
            isValid,
            isValid 
                ? `Valid trim size combination: ${dimension}mm`
                : `Invalid trim size combination: ${dimension}mm`
        );
    }

    validateColor(context) {
        const { colour, grammage, results } = context;
        if (!colour || !grammage) {
            this.addResult(
                results,
                'Color Compatibility',
                false,
                !colour ? 'Color is missing' : 'Paper weight is missing (required for color validation)'
            );
            return;
        }
        const isValid = CONFIG.PAPER_WEIGHTS[grammage]?.colors.has(colour);
        
        this.addResult(
            results,
            'Colour Spec Validation',
            isValid,
            isValid 
                ? `Valid color: ${colour}`
                : `Invalid color ${colour} for ${grammage}`
        );
    }
}