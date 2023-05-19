'use strict';

/**
 * The wrapper function that requests to backend php_curl.
 *
 * @param {string} url Target url to fetch.
 * @returns {Promise<Response>} The task.
 */
const curlFetch = async (url) => {
    let baseUri = `${location.protocol}//${location.host}${location.pathname}`;
    baseUri = baseUri.substring(0, baseUri.lastIndexOf('/'));
    return fetch(`${baseUri}/backend/curl.php?url=${encodeURI(url)}`);
};

export { curlFetch };
