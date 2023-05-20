'use strict';

/**
 * @typedef {import('../model/minecraft_res_pack.js').default} MinecraftResPack
 * @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson
 * @typedef {import('../@types/sounds_json.js').SoundEntry} SoundEntry
 * @typedef {import('../@types/assets_json.js').AssetsJson} AssetsJson
 */

import ExtraSounds from '../model/extra_sounds.js';
import MinecraftAssets from '../model/minecraft_assets.js';
import Arrays from './arrays.js';

class StateHandler {
    /** @type {MinecraftResPack | undefined} */
    static #resourcePack = undefined;
    /** @type {string} */
    static #extraSoundsVer;
    /** @type {string} */
    static #minecraftVer;
    /** @type {AssetsJson} */
    static #vanillaAssetsJson = {};
    /** @type {string[]} */
    static #allSoundNameList = [];
    /** @type {SoundsJson} */
    static #vanillaSoundsJson = {};
    /** @type {{ extrasounds: SoundsJson }} */
    static #modSoundsJson = {};
    /** @type {string[]} */
    static #extraSoundsEntryList = [];

    /**
     * Creates the new project with resPack.
     *
     * @param {MinecraftResPack} resPack Source pack data.
     * @param {string} extraSoundsVer    Target ExtraSounds' version.
     * @returns {Promise<void>} The task.
     */
    static createProjectAsync(resPack, extraSoundsVer) {
        this.#resourcePack = resPack;
        this.#extraSoundsVer = extraSoundsVer;
        return this.refreshJsonAsync();
    }

    /**
     * Clears all states.
     */
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

    /**
     * Fetches and loads all json.
     *
     * @returns {Promise<void>} The task.
     */
    static async refreshJsonAsync() {
        this.#minecraftVer = this.#resourcePack.getMCVerFromPackFormat();
        const tasks = [];
        tasks.push((async () => {
            await MinecraftAssets.getMCAssetsJsonAsync(this.#minecraftVer)
                .then(json => {
                    Object.keys(json['objects'])
                        .filter(key => !key.endsWith('.ogg') || key.startsWith('minecraft/sounds/music/'))
                        .forEach(key => {
                            delete json['objects'][key];
                        });
                    this.#vanillaAssetsJson = json;
                });
        })());
        tasks.push((async () => {
            await MinecraftAssets.getMCSoundsJsonAsync(this.#minecraftVer)
                .then(json => {
                    Object.keys(json)
                        .filter(key => key.startsWith('music.') || key.startsWith('music_disc.'))
                        .forEach(key => {
                            delete json[key];
                        });
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
                .map(value => 'minecraft:'.concat(value));
            const mcSoundFiles = Object.keys(this.#vanillaAssetsJson['objects'])
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
     * Attempts re-target ResourcePack.
     *
     * @param {string} extraSoundsVer Target ExtraSounds' version
     * @returns {Promise<void>} The task.
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
     * Attempts to play the specified sound.
     *
     * @param {string} soundName Target sound, such as 'minecraft:block.stone.hit' or 'minecraft:note/hat'.
     * @param {number} volume    The volume.
     * @param {number} pitch     The pitch.
     * @param {boolean} isEvent  If true, searches real file recursively.
     * @return {Promise<void>} The playback task.
     */
    static async playSoundAsync(soundName, volume, pitch, isEvent) {
        let fileName = undefined, namespace = 'minecraft', path = undefined;
        const isVanilla = soundName.startsWith('minecraft:') || !(soundName.includes(':'));
        if (isEvent) {
            let entryNamespace = undefined;
            if (soundName.includes(':')) {
                [entryNamespace, soundName] = soundName.split(':');
            }
            const entries = (isVanilla) ?
                this.#vanillaSoundsJson[soundName]['sounds'] :
                this.#modSoundsJson[entryNamespace][soundName]['sounds'];
            /** @type {SoundEntry} */
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
            fileName = soundName;
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
     * Determines the specified sound name is event or not.
     *
     * @param {string} name Traget sound name.
     * @returns {boolean} Returns true if the name is event sound.
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
