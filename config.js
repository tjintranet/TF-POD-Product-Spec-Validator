// Configuration object for the validator
//
// NOTE: This validator operates on RAW (pre-transform) XML.
// Values here reflect what the source XML contains before any XSL transform is applied.

const CONFIG = {
    BINDING_MAP: {
        'Hardback': 'Cased',
        'Paperback': 'Limp',
        'Cased': 'Hardback',
        'Limp': 'Paperback'
    },

    PRODUCTION_CLASSES: new Set([
        'Standard',
        'Premium',
        'Complex',
        'Premium Inkjet (Suitable)'
    ]),

    // Pre-transform treatment values (long form)
    VALID_TREATMENTS: new Set([
        'Gloss laminate',
        'Matt laminate'
    ]),

    // Page extent limits. Grammage keys are pre-transform long-form strings.
    PAGE_EXTENT: {
        MIN: 64,
        MAX_BY_GRAMMAGE: {
            '80gsm/50lb':  1040,
            '90gsm/60lb':  1320,
            '105gsm/70lb': 1320
        },
        DEFAULT_MAX: 1040
    },

    // Grammage keys are pre-transform long-form strings.
    // 80gsm has separate dimension sets per binding type.
    // version_type keys use pre-transform values: 'Paperback' / 'Hardback'.
    PAPER_WEIGHTS: {
        '80gsm/50lb': {
            // Paperback includes 127x203; Hardback does not
            dimensions_by_binding: {
                'Paperback': new Set([
                    '123x186', '127x203', '129x198', '138x216',
                    '140x216', '148x210', '152x229', '156x234',
                    '165x235', '169x244', '170x240', '171x246',
                    '172x216', '174x246', '178x254', '189x246',
                    '191x235', '204x254', '210x280', '210x297'
                ]),
                'Hardback': new Set([
                    '123x186', '129x198', '138x216',
                    '140x216', '148x210', '152x229', '156x234',
                    '165x235', '169x244', '170x240', '171x246',
                    '172x216', '174x246', '178x254', '189x246',
                    '191x235', '204x254', '210x280', '210x297'
                ])
            },
            colors: new Set(['1']),
            bindings: new Set(['Cased', 'Limp'])
        },
        '90gsm/60lb': {
            dimensions: new Set([
                '129x198', '138x216', '152x229', '156x234',
                '174x246', '178x254', '210x280', '210x297'
            ]),
            colors: new Set(['4', 'Scattercolor']),
            bindings: new Set(['Cased', 'Limp'])
        },
        '105gsm/70lb': {
            dimensions: new Set([]), // No specific dimension restrictions defined in XSL
            colors: new Set(['4', 'Scattercolor']),
            bindings: new Set(['Cased', 'Limp'])
        }
    }
};
