'use strict';

/**
 * @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson
 * @typedef {import('../@types/assets_json.js').AssetsJson} AssetsJson
 */

import { curlFetch } from '../util/curl_fetch.js';

const manifestUri = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

const resourcesUriTemplate = 'https://resources.download.minecraft.net/${first2Letter}/${hash}';

export default class MinecraftAssets {
    /**
     * Parses the uri from file hash.
     *
     * @param {string} hash Target SHA.
     * @returns {string} The uri string.
     */
    static getResourceUri(hash) {
        return resourcesUriTemplate
            .replace('${first2Letter}', hash.slice(0, 2))
            .replace('${hash}', hash);
    }

    /**
     * Retrieves json objects for all Minecraft assets.
     *
     * @param {string} mcVersion Target Minecraft version.
     * @returns {Promise<AssetsJson>} The json objects.
     */
    static async getMCAssetsJsonAsync(mcVersion = 'latest') {
        return curlFetch(manifestUri)
            .then(response => response.json())
            .then(json => {
                let versJsonUri = undefined;
                if (mcVersion === 'latest') {
                    mcVersion = json['latest']['release'];
                }
                json['versions'].forEach(version => {
                    if (version['id'] !== mcVersion) {
                        return;
                    }
                    versJsonUri = version['url'];
                });
                return curlFetch(versJsonUri);
            }).then(response => response.json())
            .then(versJson => curlFetch(versJson['assetIndex']['url']))
            .then(response => response.json())
            .catch(() => new Object());
    }

    /**
     * Retrieves json objects for Minecraft sounds.
     *
     * @param {string} mcVersion Target Minecraft version.
     * @returns {Promise<SoundsJson>} The json objects.
     */
    static async getMCSoundsJsonAsync(mcVersion = 'latest') {
        return this.getMCAssetsJsonAsync(mcVersion)
            .then(assetsJson => curlFetch(this.getResourceUri(assetsJson['objects']['minecraft/sounds.json']['hash'])))
            .then(response => response.json())
            .catch(() => new Object());
    }

    /**
     * Merges the specified sounds.json.
     *
     * @param {SoundsJson} base      The base json object.
     * @param {...SoundsJson} merger Target object array to merge.
     * @return {Promise<SoundsJson>} The result.
     */
    static async mergeSoundsJson(base, ...merger) {
        merger.forEach(json => {
            Object.keys(json).forEach(key => {
                if (base[key] === undefined || json[key]['replace'] === true) {
                    base[key] = json[key];
                } else {
                    base[key]['sounds'].concat(json[key]['sounds']);
                }
            });
        });
        return base;
    }

    /**
     * Returns string array that contains empty sounds.
     *
     * @param {SoundsJson} soundsJson Target json object.
     * @returns String array in Promise.
     */
    static async getEmptySoundEntry(soundsJson) {
        return Object.keys(soundsJson).filter(entry => {
            return soundsJson[entry]['sounds'].filter(sound => !sound['name']);
        });
    }
}
