/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

export interface RGBA {
    /**
     * Red: integer in [0-255]
     */
    readonly r: number;

    /**
     * Green: integer in [0-255]
     */
    readonly g: number;

    /**
     * Blue: integer in [0-255]
     */
    readonly b: number;

    /**
     * Alpha: float in [0-1]
     */
    readonly a: number;
}

export function parseHex(hex?: string): RGBA | null {
    if (!hex) {
        return null;
    }

    const length = hex.length;

    if (length === 0) {
        // Invalid color
        return null;
    }

    if (hex.charAt(0) !== '#') {
        // Does not begin with a #
        return null;
    }

    if (length === 7) {
        // #RRGGBB format
        const r = 16 * _parseHexDigit(hex.charAt(1)) + _parseHexDigit(hex.charAt(2));
        const g = 16 * _parseHexDigit(hex.charAt(3)) + _parseHexDigit(hex.charAt(4));
        const b = 16 * _parseHexDigit(hex.charAt(5)) + _parseHexDigit(hex.charAt(6));
        return { r, g, b, a: 1 };
    }

    if (length === 9) {
        // #RRGGBBAA format
        const r = 16 * _parseHexDigit(hex.charAt(1)) + _parseHexDigit(hex.charAt(2));
        const g = 16 * _parseHexDigit(hex.charAt(3)) + _parseHexDigit(hex.charAt(4));
        const b = 16 * _parseHexDigit(hex.charAt(5)) + _parseHexDigit(hex.charAt(6));
        const a = 16 * _parseHexDigit(hex.charAt(7)) + _parseHexDigit(hex.charAt(8));
        return { r, g, b, a: a / 255 };
    }

    if (length === 4) {
        // #RGB format
        const r = _parseHexDigit(hex.charAt(1));
        const g = _parseHexDigit(hex.charAt(2));
        const b = _parseHexDigit(hex.charAt(3));
        return {
            r: 16 * r + r,
            g: 16 * g + g,
            b: 16 * b + b,
            a: 1
        };
    }

    if (length === 5) {
        // #RGBA format
        const r = _parseHexDigit(hex.charAt(1));
        const g = _parseHexDigit(hex.charAt(2));
        const b = _parseHexDigit(hex.charAt(3));
        const a = _parseHexDigit(hex.charAt(4));
        return {
            r: 16 * r + r,
            g: 16 * g + g,
            b: 16 * b + b,
            a: (16 * a + a) / 255
        };
    }

    // Invalid color
    return null;
}

function _parseHexDigit(char: string): number {
    switch (char.toLowerCase()) {
        case '0': return 0;
        case '1': return 1;
        case '2': return 2;
        case '3': return 3;
        case '4': return 4;
        case '5': return 5;
        case '6': return 6;
        case '7': return 7;
        case '8': return 8;
        case '9': return 9;
        case 'a': return 10;
        case 'b': return 11;
        case 'c': return 12;
        case 'd': return 13;
        case 'e': return 14;
        case 'f': return 15;
    }
    return 0;
}
