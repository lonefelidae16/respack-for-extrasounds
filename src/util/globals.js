'use strict';

import ExtraSounds from '../model/extra_sounds';
import MinecraftAssets from '../model/minecraft_assets.js';
import Arrays from './arrays.js';

class StateHandler {
    /** @type {import('../model/minecraft_res_pack.js').default | undefined} */
    static #resourcePack = undefined;
    /** @type {string} */
    static #extraSoundsVer;
    /** @type {{ objects: {} }} */
    static #vanillaAssetsJson = {};
    /** @type {string[]} */
    static #allSoundNameList = [];
    static #vanillaSoundsJson = {};
    /** @type {{ extrasounds: {} }} */
    static #modSoundsJson = {};
    /** @type {string[]} */
    static #extraSoundsEntryList = [];

    /**
     * @param {import('../model/minecraft_res_pack.js').default} resPack
     * @param {string} extraSoundsVer
     */
    static createProjectAsync(resPack, extraSoundsVer) {
        this.#resourcePack = resPack;
        this.#extraSoundsVer = extraSoundsVer;
        return this.refreshJsonAsync();
    }

    static clearProject() {
        this.#resourcePack = undefined;
        this.#allSoundNameList = [];
        this.#extraSoundsEntryList = [];
        this.#vanillaAssetsJson = {};
        this.#vanillaSoundsJson = {};
        this.#modSoundsJson = {};
        this.#extraSoundsVer = '';
    }

    static async refreshJsonAsync() {
        const mcVer = this.#resourcePack.getMCVerFromPackFormat();
        const tasks = [];
        tasks.push((async () => {
            await MinecraftAssets.getMCAssetsJsonAsync(mcVer)
                .then(json => {
                    this.#vanillaAssetsJson = json;
                });
        })());
        tasks.push((async () => {
            await MinecraftAssets.getMCSoundsJsonAsync(mcVer)
                .then(json => {
                    this.#vanillaSoundsJson = json;
                });
        })());
        tasks.push((async () => {
            await ExtraSounds.fetchSoundsJsonAsync(this.#extraSoundsVer).then(json => {
                this.#modSoundsJson.extrasounds = json;
            });
        })());

        return Promise.all(tasks).then(() => {
            const esSoundNames = Object.keys(this.#modSoundsJson.extrasounds)
                .map(value => `extrasounds:${value}`);
            const esSoundEntries = Object.keys(this.#modSoundsJson.extrasounds);
            const mcSoundNames = Object.keys(this.#vanillaSoundsJson)
                .map(value => 'minecraft:'.concat(value));
            const esAutoGenBlockSounds = ExtraSounds.generateSoundPackName(this.#vanillaSoundsJson);
            // TODO: complete autogen sounds json
            const esAutoGenBlockSoundsJson = Object.fromEntries(esAutoGenBlockSounds.map(value => {
                return [value, { 'sounds': [] }];
            }));
            const esAutoGenWithNamespace = esAutoGenBlockSounds.map(value => `extrasounds:${value}`);
            const mcSoundFiles = Object.keys(this.#vanillaAssetsJson['objects'])
                .filter(value => value.endsWith('.ogg'))
                .map(value => value.replace('minecraft/sounds/', 'minecraft:').replace('.ogg', ''));

            this.#allSoundNameList = Arrays.sortedUnique(
                ...esSoundNames,
                ...mcSoundNames,
                ...esAutoGenWithNamespace,
                ...mcSoundFiles,
            );
            this.#extraSoundsEntryList = Arrays.sortedUnique(
                ...esSoundEntries,
                ...esAutoGenBlockSounds,
            );
        });
    }

    /**
     * Retrieves the SHA of vanilla asset from its file name.
     *
     * @param {string} fileName Target file name.
     * @returns {string | undefined} The SHA hash when succeeded.
     */
    static getAssetHash(fileName) {
        try {
            return StateHandler.getVanillaAssetsJson()['objects'][fileName]['hash'];
        } catch {
            return undefined;
        }
    }

    /**
     * @param {string} extraSoundsVer Target ExtraSounds' version
     */
    static async reTartgetPack(extraSoundsVer) {
        // Change ExtraSounds version.
        this.#extraSoundsVer = extraSoundsVer;
        // Retrieve compatible Minecraft version of ExtraSounds.
        const mcVer = ExtraSounds.getCompatMCVerFromExtraSoundsVer(extraSoundsVer);
        // Update pack_format.
        this.#resourcePack.setPackFormatFromMCVer(mcVer);
        // Obtain sounds.json by version.
        await this.refreshJsonAsync();
        // TODO: Check missing sound entry when pack_format downgraded
    }

    /**
     * Playbacks the file located in ResourcePack zip.
     *
     * @param {string} fileName Target file name, like 'assets/namespace/sounds/custom/sound.ogg'.
     * @param {number} volume   The volume.
     * @param {number} pitch    The pitch.
     */
    static async playBlobInZipAsync(fileName, volume, pitch) {
        return this.#resourcePack.getFileAsync(fileName, 'uint8array').then(data => {
            if (!data) {
                throw new Error();
            }
            const blob = new Blob([data.value], { type: 'audio/ogg' });
            return ExtraSounds.playSoundAsync(URL.createObjectURL(blob), volume, pitch);
        });
    }

    /**
     * Playbacks the specified Minecraft vanilla asset file.
     *
     * @param {string} fileName Target file name, like 'minecraft/sounds/block/amethyst/break1.ogg'.
     * @param {number} volume   The volume.
     * @param {number} pitch    The pitch.
     */
    static async playVanillaAssetAsync(fileName, volume, pitch) {
        try {
            const hash = this.getAssetHash(fileName);
            return ExtraSounds.playSoundAsync(MinecraftAssets.getResourceUri(hash), volume, pitch);
        } catch {
            return undefined;
        }
    }

    /**
     *
     * @param {string} entryName
     * @param {number} volume
     * @param {number} pitch
     * @param {boolean} isEvent
     * @return {Promise<void | undefined>}
     */
    static async playSoundAsync(entryName, volume, pitch, isEvent) {
        let fileName = undefined, namespace = 'minecraft', path = undefined;
        const isVanilla = entryName.startsWith('minecraft:') || !(entryName.includes(':'));
        try {
            if (isEvent) {
                let entryNamespace = undefined;
                if (entryName.includes(':')) {
                    [entryNamespace, entryName] = entryName.split(':');
                }
                /** @type {{name: string, volume: number, pitch: number, weight: number, type: string}[] | string[]} */
                let entries;
                if (isVanilla) {
                    entries = this.#vanillaSoundsJson[entryName]['sounds'];
                } else if (entryNamespace === 'extrasounds' && !this.#modSoundsJson[entryNamespace][entryName]) {
                    entries = ExtraSounds.getVanillaSoundEntry(entryName);
                } else {
                    entries = this.#modSoundsJson[entryNamespace][entryName]['sounds'];
                }
                const pickedEntry = entries[Math.floor(Math.random() * entries.length)];
                if ((typeof pickedEntry) === 'string') {
                    fileName = pickedEntry;
                } else if (pickedEntry['type'] === 'event') {
                    const entryVolume = pickedEntry['volume'] ?? 1;
                    const entryPitch = pickedEntry['pitch'] ?? 1;
                    return this.playSoundAsync(pickedEntry['name'], volume * entryVolume, pitch * entryPitch, true);
                } else {
                    fileName = pickedEntry['name'];
                    if (pickedEntry['volume']) {
                        volume *= pickedEntry['volume'];
                    }
                    if (pickedEntry['pitch']) {
                        pitch *= pickedEntry['pitch'];
                    }
                }
            } else {
                fileName = entryName;
            }

            if (fileName.includes(':')) {
                [namespace, path] = fileName.split(':');
            } else {
                path = fileName;
            }
            fileName = `${namespace}/sounds/${path}.ogg`;

            if (fileName in this.#vanillaAssetsJson['objects']) {
                return this.playVanillaAssetAsync(fileName, volume, pitch);
            } else {
                return this.playBlobInZipAsync(`assets/${fileName}`, volume, pitch);
            }
        } catch {
            return undefined;
        }
    }

    static getResourcePack() {
        return this.#resourcePack;
    }

    static getExtraSoundsVer() {
        return this.#extraSoundsVer;
    }

    static getExtraSoundsEntryList() {
        return this.#extraSoundsEntryList;
    }

    static getSoundNameList() {
        return this.#allSoundNameList;
    }

    static getVanillaAssetsJson() {
        return this.#vanillaAssetsJson;
    }

    static getModSoundsJson() {
        return this.#modSoundsJson;
    }

    static getVanillaSoundsJson() {
        return this.#vanillaSoundsJson;
    }
}

export { StateHandler };
