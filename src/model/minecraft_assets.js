'use strict';

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
     * @returns {Promise<object>} The json objects.
     */
    static async getMCAssetsJsonAsync(mcVersion = 'latest') {
        return fetch(manifestUri)
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
                return fetch(versJsonUri);
            }).then(response => response.json())
            .then(versJson => fetch(versJson['assetIndex']['url']))
            .then(response => response.json())
            .catch(() => new Object());
    }

    /**
     * Retrieves json objects for Minecraft sounds.
     *
     * @param {string} mcVersion Target Minecraft version.
     * @returns {Promise<object>} The json objects.
     */
    static async getMCSoundsJsonAsync(mcVersion = 'latest') {
        return this.getMCAssetsJsonAsync(mcVersion)
            .then(assetsJson => fetch(this.getResourceUri(assetsJson['objects']['minecraft/sounds.json']['hash'])))
            .then(response => response.json())
            .catch(() => new Object());
    }
}
