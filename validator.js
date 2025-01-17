class SpecificationValidator {
    constructor() {
        this.validationSteps = [
            this.validateRequiredFields,
            this.validatePaperWeight,
            this.validateBinding,
            this.validateDimensions,
            this.validateColor
        ];
    }

    validate(xmlDoc, fileName) {
        const results = [];
        const context = {
            version_type: xmlDoc.querySelector('version_type')?.textContent?.trim(),
            width: xmlDoc.querySelector('format width')?.textContent?.trim(),
            height: xmlDoc.querySelector('format height')?.textContent?.trim(),
            grammage: xmlDoc.querySelector('parts text grammage')?.textContent?.trim(),
            colour: xmlDoc.querySelector('parts text colour')?.textContent?.trim(),
            fileName: fileName,
            results: results
        };

        for (const step of this.validationSteps) {
            const shouldContinue = step.call(this, context);
            if (!shouldContinue) break;
        }

        return results;
    }

    addResult(results, test, result, message) {
        results.push({ test, result, message });
        return result;
    }

    validateRequiredFields(context) {
        const { version_type, width, height, grammage, colour, results, fileName } = context;
        
        this.addResult(results, 'File', true, `Processing: ${fileName}`);
        
        return this.addResult(
            results,
            'Required Fields',
            Boolean(version_type && width && height && grammage && colour),
            'All required fields present'
        );
    }

    validatePaperWeight(context) {
        const { grammage, results } = context;
        return this.addResult(
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
        
        return this.addResult(
            results,
            'Binding Type',
            CONFIG.PAPER_WEIGHTS[grammage].bindings.has(normalizedBinding.trim()),
            `Binding: ${normalizedBinding}`
        );
    }

    validateDimensions(context) {
        const { width, height, grammage, results } = context;
        const dimension = `${width}x${height}`;
        
        return this.addResult(
            results,
            'Size Combination',
            CONFIG.PAPER_WEIGHTS[grammage].dimensions.has(dimension),
            CONFIG.PAPER_WEIGHTS[grammage].dimensions.has(dimension)
                ? `Valid trim size combination: ${dimension}mm`
                : `Invalid trim size combination: ${dimension}mm`
        );
    }

    validateColor(context) {
        const { colour, grammage, results } = context;
        
        return this.addResult(
            results,
            'Color Compatibility',
            CONFIG.PAPER_WEIGHTS[grammage].colors.has(colour),
            CONFIG.PAPER_WEIGHTS[grammage].colors.has(colour)
                ? `Valid color: ${colour}`
                : `Invalid color ${colour} for ${grammage}`
        );
    }
}