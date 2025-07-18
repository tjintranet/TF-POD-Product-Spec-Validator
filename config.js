// Configuration object for the validator
const CONFIG = {
    BINDING_MAP: {
        'Hardback': 'Cased',
        'Paperback': 'Limp',
        'Cased': 'Hardback',
        'Limp': 'Paperback'
    },
    PRODUCTION_CLASSES: new Set([
        'Standard',
        'Premium'
    ]),
    VALID_TREATMENTS: new Set([
        'Gloss laminate',
        'Matt laminate'
    ]),
    MAX_PAGE_EXTENT: 1040,
    PAPER_WEIGHTS: {
        '80gsm/50lb': {
            dimensions: new Set([
                '123x186', '127x203', '129x198', '129x216', '138x216', 
                '140x216', '148x210', '152x229', '156x234', '165x235', 
                '169x244', '170x240', '171x246', '172x216', '172x210', 
                '174x246', '178x254', '189x246', '191x235', '204x254', 
                '210x280', '210x297'
            ]),
            colors: new Set(['1']),
            bindings: new Set(['Cased', 'Limp'])
        },
        '90gsm/60lb': {
            dimensions: new Set([
                '129x198', '138x216', '152x229', '156x234', '174x246', 
                '178x254', '210x280', '210x297'
            ]),
            colors: new Set(['4', 'Scattercolor', '4 or Scattercolour']),
            bindings: new Set(['Cased', 'Limp'])
        }
    }
};
