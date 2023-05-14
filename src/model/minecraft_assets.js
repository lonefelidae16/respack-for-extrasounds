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
    static async getAllMCAssetsJson(mcVersion = 'latest') {
        try {
            const manifestJson = await fetch(manifestUri).then(response => response.json());
            let versJsonUri = undefined;
            if (mcVersion === 'latest') {
                mcVersion = manifestJson['latest']['release'];
            }
            manifestJson['versions'].forEach(version => {
                if (version['id'] !== mcVersion) {
                    return;
                }
                versJsonUri = version['url'];
            });
            const assetsJsonUri = await fetch(versJsonUri)
                .then(response => response.json())
                .then(versJson => versJson['assetIndex']['url']);
            return await fetch(assetsJsonUri).then(response => response.json());
        } catch {
            return {};
        }
    }
}