class SpecificationValidator {
    constructor() {
        this.validationSteps = [
            this.validateRequiredFields,
            this.validateProductionClass,
            this.validatePaperWeight,
            this.validateBinding,
            this.validateBindingStyle, // New validation step
            this.validateDimensions,
            this.validateColor,
            this.validateTreatment,
            this.validatePageExtent
        ];
    }

    validate(xmlDoc) {
        const results = [];
        
        // Extract generator information
        const firstName = xmlDoc.querySelector('xml_generated_by first_name')?.textContent?.trim() || '';
        const lastName = xmlDoc.querySelector('xml_generated_by last_name')?.textContent?.trim() || '';
        const generator = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : '';
        
        const context = {
            version_type: xmlDoc.querySelector('version_type')?.textContent?.trim(),
            width: xmlDoc.querySelector('format width')?.textContent?.trim(),
            height: xmlDoc.querySelector('format height')?.textContent?.trim(),
            grammage: xmlDoc.querySelector('parts text grammage')?.textContent?.trim(),
            colour: xmlDoc.querySelector('parts text colour')?.textContent?.trim(),
            production_class: xmlDoc.querySelector('production_class')?.textContent?.trim(),
            treatment: xmlDoc.querySelector('parts covers treatment')?.textContent?.trim(),
            page_extent: xmlDoc.querySelector('page_extent')?.textContent?.trim(),
            binding_style: xmlDoc.querySelector('binding style')?.textContent?.trim(),
            generator: generator, // Add generator information
            results: results
        };

        // Run all validation steps
        for (const step of this.validationSteps) {
            step.call(this, context);
        }

        return results;
    }

    addResult(results, test, result, message) {
        results.push({ test, result, message });
    }

    validateRequiredFields(context) {
        const { version_type, width, height, grammage, colour, production_class, treatment, page_extent, binding_style, results } = context;
        
        // Check each required field
        const requiredFields = {
            'Binding Type': version_type,
            'Width': width,
            'Height': height,
            'Paper Weight': grammage,
            'Color': colour,
            'Production Class': production_class,
            'Treatment': treatment,
            'Page Extent': page_extent,
            'Binding Style': binding_style // Add new required field
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
        const normalizedBinding = CONFIG.BINDING_MAP[version_type] || version_type;
        
        this.addResult(
            results,
            'Binding Type',
            CONFIG.PAPER_WEIGHTS[grammage]?.bindings.has(normalizedBinding.trim()),
            `Binding: ${normalizedBinding}`
        );
    }

    validateBindingStyle(context) {
        const { binding_style, results } = context;
        
        if (!binding_style) {
            this.addResult(
                results,
                'Binding Style',
                false,
                'Binding style is missing or empty'
            );
            return;
        }

        // Check if binding style starts with Limp or Cased
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
        const { width, height, grammage, results } = context;
        const dimension = `${width}x${height}`;
        
        this.addResult(
            results,
            'Size Combination',
            CONFIG.PAPER_WEIGHTS[grammage]?.dimensions.has(dimension),
            CONFIG.PAPER_WEIGHTS[grammage]?.dimensions.has(dimension)
                ? `Valid trim size combination: ${dimension}mm`
                : `Invalid trim size combination: ${dimension}mm`
        );
    }

    validateColor(context) {
        const { colour, grammage, results } = context;
        
        this.addResult(
            results,
            'Color Compatibility',
            CONFIG.PAPER_WEIGHTS[grammage]?.colors.has(colour),
            CONFIG.PAPER_WEIGHTS[grammage]?.colors.has(colour)
                ? `Valid color: ${colour}`
                : `Invalid color ${colour} for ${grammage}`
        );
    }

    validateTreatment(context) {
        const { treatment, results } = context;
        if (!treatment) {
            this.addResult(
                results,
                'Treatment',
                false,
                'Treatment is missing or empty'
            );
            return;
        }
        const isValid = CONFIG.VALID_TREATMENTS.has(treatment);
        
        this.addResult(
            results,
            'Treatment',
            isValid,
            isValid 
                ? `Valid treatment: ${treatment}`
                : `Invalid treatment: ${treatment} (must be either 'Gloss laminate' or 'Matt laminate')`
        );
    }

    validatePageExtent(context) {
        const { page_extent, results } = context;
        
        if (!page_extent) {
            this.addResult(
                results,
                'Page Extent',
                false,
                'Page extent is missing or empty'
            );
            return;
        }

        const pageNum = parseInt(page_extent);
        const isValid = !isNaN(pageNum) && pageNum > 0 && pageNum <= CONFIG.MAX_PAGE_EXTENT;
        
        this.addResult(
            results,
            'Page Extent',
            isValid,
            isValid 
                ? `Valid page extent: ${pageNum}`
                : `Invalid page extent: ${pageNum} (must not exceed ${CONFIG.MAX_PAGE_EXTENT} pages)`
        );
    }
}