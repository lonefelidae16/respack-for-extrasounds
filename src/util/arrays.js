'use strict';

export default class Arrays {
    /**
     * Removes duplicate values from an array.
     *
     * @param  {...any} array Target array.
     * @returns The filtered array.
     */
    static unique(...array) {
        return Array.from(new Set(array));
    }
}
