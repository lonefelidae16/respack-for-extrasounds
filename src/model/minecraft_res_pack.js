'use strict';

/**
 * @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson
 * @typedef {import('../@types/pack_mcmeta.js').PackMCMeta} PackMCMeta
 */

import JSZip from 'jszip';
import FileSaver from 'file-saver';

import Arrays from '../util/arrays.js';
import MinecraftAssets from './minecraft_assets.js';

/** @type {{ [minecraftVersion: string]: number }} */
const packFormats = {};

const LATEST_VER_STR = MinecraftAssets.latestVerStr;

const mcMetaJsonDefault = JSON.stringify({
    'pack': {
        'pack_format': 0,
        'description': 'Generated with https://www.kow08absty.com/extrasounds/respack-editor',
        'x_mc_version': LATEST_VER_STR
    }
});

const mcMeraFile = 'pack.mcmeta';
const extraSoundsJsonFile = 'assets/extrasounds/sounds.json';

export default class MinecraftResPack {
    /** @type {PackMCMeta} */
    mcMetaJson = {};
    /** @type {SoundsJson} */
    soundsJson = {};
    /** @type {JSZip} */
    zip = null;

    constructor() {
        this.mcMetaJson = JSON.parse(mcMetaJsonDefault);
        this.zip = new JSZip();
    }

    /**
     * Fetches the pack_version corresponding to the Minecraft version from GitHub API.
     *
     * @returns {Promise<{ [minecraftVersion: string]: number }>} Object in Promise.
     */
    static async fetchPackFormatDataAsync() {
        return fetch('https://api.github.com/gists/db752e2c19505c6b0e4cc4a944da3dc0')
            .then(response => response.json())
            .then(gistDataJson => fetch(gistDataJson['files']['minecraft_res_pack_format.json']['raw_url']))
            .then(response => response.json())
            .then(corrVersJson => {
                Object.assign(packFormats, corrVersJson);
                return packFormats;
            });
    }

    /**
     * Loads the ResourcePack structure from specified file.
     *
     * @param {File} file Target file object.
     * @returns {Promise<MinecraftResPack>} An instance of MinecraftResPack object.
     */
    static async loadResPack(file) {
        const result = new MinecraftResPack();

        try {
            // unzip test
            result.zip = null;
            const zip = await JSZip.loadAsync(file);
            result.zip = zip;
        } catch {
            return result;
        }

        const zip = result.zip;

        try {
            // ExtraSounds' sounds.json parse test
            result.soundsJson = JSON.parse(await zip.file(extraSoundsJsonFile).async('string'));
        } catch {
            result.soundsJson = null;
            return result;
        }

        try {
            // pack.mcmeta parse test
            Object.assign(result.mcMetaJson, JSON.parse(await zip.file(mcMeraFile).async('string')));
        } catch {
            result.mcMetaJson = JSON.parse(mcMetaJsonDefault);
        }

        return result;
    }

    /**
     * Reads specified file from zip.
     *
     * @param {string} fileName Target file path.
     * @param {string} type     "base64" | "string" | "text" | "binarystring" | "array" | "uint8array" | "arraybuffer" | "blob" | "nodebuffer"
     * @returns {Promise<string | number[] | Uint8Array | ArrayBuffer | Blob | Buffer>} The file content in Promise.
     */
    async getFileAsync(fileName, type) {
        try {
            const file = this.zip.file(fileName);
            return file.async(type).catch(() => undefined);
        } catch {
            return undefined;
        }
    }

    /**
     * Generates and Downloads the ResourcePack as Zip file.
     */
    generateZip() {
        this.zip.file(mcMeraFile, JSON.stringify(this.mcMetaJson, null, 2));
        this.zip.file(extraSoundsJsonFile, JSON.stringify(this.soundsJson, null, 2));
        this.zip.generateAsync({ type: 'blob' }).then(content => {
            FileSaver.saveAs(content, `ExtraSounds-CustomResPack-${this.getMCVer()}.zip`);
        });
    }

    /**
     * Attempts to get the Minecraft version string from 'pack.mcmeta'.
     *
     * @returns {string} Minecraft version.
     */
    getMCVer() {
        const result = this.mcMetaJson['pack']['x_mc_version'];
        if (!result) {
            return this.getMCVerFromPackFormat();
        } else if (result === LATEST_VER_STR) {
            return this.getLatestMCVer();
        } else {
            return result;
        }
    }

    /**
     * Sets the Minecraft version string to 'pack.mcmeta'.
     *
     * @param {string} mcVer Target Minecraft version.
     */
    setMCVer(mcVer) {
        this.mcMetaJson['pack']['x_mc_version'] = mcVer;
    }

    /**
     * Determines the compatible Minecraft version from pack_format of this object.
     *
     * @returns {string} Minecraft version.
     */
    getMCVerFromPackFormat() {
        let result = LATEST_VER_STR;
        Object.keys(packFormats).forEach(mcVer => {
            if (packFormats[mcVer] === this.getPackFormat()) {
                result = mcVer;
            }
        });
        return result;
    }

    /**
     * Determines the pack_format version from Minecraft version.
     *
     * @param {string} targetMCVer Minecraft version.
     */
    setPackFormatFromMCVer(targetMCVer = LATEST_VER_STR) {
        if (targetMCVer === LATEST_VER_STR) {
            targetMCVer = this.getLatestMCVer();
        }
        this.mcMetaJson['pack']['pack_format'] = this.retrievePackFormatFromMCVer(targetMCVer);
    }

    retrievePackFormatFromMCVer(targetMCVer) {
        const versions = Arrays.versionSort(Object.keys(packFormats));
        let packFormat = packFormats[targetMCVer];
        for (let i = 0; i < versions.length && packFormat === undefined; ++i) {
            const ver = versions[i];
            if (targetMCVer.localeCompare(ver, [], { numeric: true }) >= 0) {
                packFormat = packFormats[ver];
                break;
            }
        }
        return packFormat ?? 0;
    }

    /**
     * Gets the format version of this ResourcePack.
     *
     * @returns {number} pack_format
     */
    getPackFormat() {
        return this.mcMetaJson['pack']['pack_format'];
    }

    getLatestMCVer() {
        return Arrays.versionSort(Object.keys(packFormats))[0];
    }

    /**
     * Determines if this pack_format matches for target Minecraft version.
     *
     * @returns {boolean} True if this pack has valid format integer.
     */
    checkExactPackFormat(mcVer = LATEST_VER_STR) {
        if (mcVer === LATEST_VER_STR) {
            mcVer = this.getLatestMCVer();
        }
        const packFormat = this.getPackFormat();
        const expectedPackFormat = this.retrievePackFormatFromMCVer(mcVer);
        return packFormat === expectedPackFormat;
    }
}
