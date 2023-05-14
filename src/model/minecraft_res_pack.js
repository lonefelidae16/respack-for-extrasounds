'use strict';

import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { versionSort } from '../util/versions';

const MCPackVersions = {};
fetch('https://api.github.com/gists/db752e2c19505c6b0e4cc4a944da3dc0')
    .then(response => response.json())
    .then(gistDataJson => fetch(gistDataJson['files']['minecraft_res_pack_format.json']['raw_url']))
    .then(response => response.json())
    .then(corrVersJson => Object.assign(MCPackVersions, corrVersJson));

const MCMetaJsonDefault = JSON.stringify({
    'pack': {
        'pack_format': 0,
        'description': 'Generated with https://www.kow08absty.com/extrasounds/respack-editor'
    }
});

const MCMeraFile = 'pack.mcmeta';
const extraSoundsJsonFile = 'assets/extrasounds/sounds.json';

export default class MinecraftResPack {
    mcMetaJson = {};
    soundsJson = {};
    /** @type {JSZip} */
    zip = null;

    constructor() {
        this.mcMetaJson = JSON.parse(MCMetaJsonDefault);
        this.zip = new JSZip();
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
            result.zip = null;
            const zip = await JSZip.loadAsync(file);
            Object.assign(result.mcMetaJson, JSON.parse(await zip.file(MCMeraFile).async('string')));
            result.zip = zip;
            result.soundsJson = JSON.parse(await zip.file(extraSoundsJsonFile).async('string'));
        } catch {
            result.soundsJson = null;
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
    async getFile(fileName, type) {
        try {
            return await this.zip.file(fileName).async(type);
        } catch {
            return undefined;
        }
    }

    /**
     * Generates and Downloads the ResourcePack as Zip file.
     */
    generateZip() {
        this.zip.file(MCMeraFile, JSON.stringify(this.mcMetaJson, null, 2));
        this.zip.file(extraSoundsJsonFile, JSON.stringify(this.soundsJson, null, 2));
        this.zip.generateAsync({ type: 'blob' }).then(content => {
            FileSaver.saveAs(content, `ExtraSounds-CustomResPack-${this.getMCVerFromPackFormat()}.zip`);
        });
    }

    /**
     * Determines the compatible Minecraft version from pack_format of this object.
     *
     * @returns {string} Minecraft version.
     */
    getMCVerFromPackFormat() {
        let result = 'latest';
        Object.keys(MCPackVersions).forEach(mcVer => {
            if (MCPackVersions[mcVer] === this.mcMetaJson['pack']['pack_format']) {
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
    setPackFormatFromMCVer(targetMCVer = 'latest') {
        const versions = versionSort(Object.keys(MCPackVersions));
        if (targetMCVer === 'latest') {
            targetMCVer = versions[0];
        }
        let packFormat = MCPackVersions[targetMCVer];
        for (let i = 0; i < versions.length && packFormat === undefined; ++i) {
            const ver = versions[i];
            if (targetMCVer.localeCompare(ver, [], { numeric: true }) >= 0) {
                packFormat = MCPackVersions[ver];
                break;
            }
        }
        if (packFormat === undefined) {
            packFormat = -1;
        }
        this.mcMetaJson['pack']['pack_format'] = packFormat;
    }
}
