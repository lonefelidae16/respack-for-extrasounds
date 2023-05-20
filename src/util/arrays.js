'use strict';

export default class Arrays {
    /**
     * Removes duplicate values from an array.
     *
     * @param  {any[]} array Target array.
     * @returns The filtered array.
     */
    static unique(array) {
        return Array.from(new Set(array));
    }

    /**
     * Removes duplicate values and sortes for string array.
     *
     * @param {string[]} array Target array.
     * @returns The filtered and sorted array.
     */
    static sortedUnique(array, isDescending = false) {
        return this.unique(array).sort((a, b) => (isDescending ? -1 : 1) * a.toUpperCase().localeCompare(b.toUpperCase()));
    }

    /**
     * Removes null or undefined elements from an array.
     *
     * @param {any[]} array Target array.
     * @returns Filtered array.
     */
    static filterNonNull(array) {
        return array.filter(n => n !== null && n !== undefined);
    }
}
