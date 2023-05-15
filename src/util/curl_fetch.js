'use strict';

/**
 * The wrapper function that requests to backend php_curl.
 *
 * @param {string} url Target url to fetch.
 * @returns
 */
const curlFetch = async (url) => {
    let baseUri = `${location.protocol}//${location.host}${location.pathname}`;
    if (baseUri.endsWith('/')) {
        baseUri = baseUri.substring(0, baseUri.length - 1);
    }
    return fetch(`${baseUri}/backend/curl.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${url}`,
    });
};

export { curlFetch };
