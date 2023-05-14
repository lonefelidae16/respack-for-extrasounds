'use strict';

const versionSort = function (targetArray, descending = true) {
    return targetArray.slice().sort((a, b) => (descending ? 1 : -1) * b.localeCompare(a, [], { numeric: true }));
};

export { versionSort };
