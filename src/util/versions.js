'use strict';

/**
 * The wrapper function that sorting with string#localeCompare().
 *
 * @param {string[]} targetArray Target array to sort.
 * @param {boolean} descending   If true, first element will be latest one.
 * @returns {string[]} Sorted array.
 */
const versionSort = function (targetArray, descending = true) {
    return targetArray.slice().sort((a, b) => (descending ? 1 : -1) * b.localeCompare(a, [], { numeric: true }));
};

export { versionSort };
