'use strict';

export default class MathHelper {
    /**
     * Clamps the input number between min and max.
     *
     * @param {number} input The target value.
     * @param {number} min   Expected minimum value.
     * @param {number} max   Expected maximum value.
     * @returns {number} Clamped value.
     */
    static clamp(input, min, max) {
        return (input > max) ? max : ((input < min) ? min : input);
    }
}
