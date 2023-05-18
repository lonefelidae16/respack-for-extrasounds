'use strict';

import ExtraSounds from '../model/extra_sounds';
import MinecraftAssets from '../model/minecraft_assets.js';
import Arrays from './arrays.js';

class StateHandler {
    /** @type {import('../model/minecraft_res_pack.js').default | undefined} */
    static #resourcePack = undefined;
    /** @type {string} */
    static #extraSoundsVer;
    /** @type {string} */
    static #minecraftVer;
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
        this.#minecraftVer = '';
    }

    static async refreshJsonAsync() {
        this.#minecraftVer = this.#resourcePack.getMCVerFromPackFormat();
        const tasks = [];
        tasks.push((async () => {
            await MinecraftAssets.getMCAssetsJsonAsync(this.#minecraftVer)
                .then(json => {
                    this.#vanillaAssetsJson = json;
                });
        })());
        tasks.push((async () => {
            await MinecraftAssets.getMCSoundsJsonAsync(this.#minecraftVer)
                .then(json => {
                    this.#vanillaSoundsJson = json;
                });
        })());
        tasks.push((async () => {
            const autoGen = await ExtraSounds.fetchAutoGenSoundsJsonAsync(this.#minecraftVer);
            const soundsJson = await ExtraSounds.fetchSoundsJsonAsync(this.#extraSoundsVer);
            await MinecraftAssets.mergeSoundsJson(autoGen, soundsJson).then(json => {
                this.#modSoundsJson['extrasounds'] = json;
            });
        })());

        return Promise.all(tasks).then(() => {
            const esSoundNames = Object.keys(this.#modSoundsJson['extrasounds'])
                .map(value => `extrasounds:${value}`);
            const mcSoundNames = Object.keys(this.#vanillaSoundsJson)
                .filter(value => !value.startsWith('minecraft/sounds/music/'))
                .map(value => 'minecraft:'.concat(value));
            const mcSoundFiles = Object.keys(this.#vanillaAssetsJson['objects'])
                .filter(value => value.endsWith('.ogg'))
                .filter(value => !value.startsWith('music.') && !value.startsWith('music_disc.'))
                .map(value => value.replace('minecraft/sounds/', 'minecraft:').replace('.ogg', ''));

            this.#allSoundNameList = Arrays.sortedUnique([
                ...esSoundNames,
                ...mcSoundNames,
                ...mcSoundFiles,
            ]);
            this.#extraSoundsEntryList = Object.keys(this.#modSoundsJson['extrasounds'])
                .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
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
    static async retartgetPack(extraSoundsVer) {
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
        if (isEvent) {
            let entryNamespace = undefined;
            if (entryName.includes(':')) {
                [entryNamespace, entryName] = entryName.split(':');
            }
            /** @type {{name: string, volume: number, pitch: number, weight: number, type: string}[] | string[]} */
            const entries = (isVanilla) ?
                this.#vanillaSoundsJson[entryName]['sounds'] :
                this.#modSoundsJson[entryNamespace][entryName]['sounds'];
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
    }

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    static isEventSoundName(name) {
        let namespace = 'minecraft', path = name;
        if (name.includes(':')) {
            [namespace, path] = name.split(':');
        }
        if (namespace === 'minecraft') {
            return this.#vanillaAssetsJson['objects'][`minecraft/sounds/${path}.ogg`] === undefined;
        } else {
            return this.#resourcePack.zip.file(`assets/${namespace}/sounds/${path}.ogg`) === null;
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
