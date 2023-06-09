'use strict';

/** @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson */

import MathHelper from '../util/math_helper.js';
import MinecraftAssets from './minecraft_assets.js';
import Arrays from '../util/arrays.js';

const soundsJsonUriTemplate = 'https://api.github.com/repos/lonefelidae16/extra-sounds/contents/src/main/resources/assets/extrasounds/sounds.json?ref=${revision}';
const soundsSchemaJsonUriTemplate = 'https://api.github.com/repos/lonefelidae16/extra-sounds/contents/schemas/sound-schema.json?ref=${revision}';

const gitHubTagsUri = 'https://api.github.com/repos/lonefelidae16/extra-sounds/tags';

const MCVerRegex = {
    'withPatch': /\d+\.\d+\.\d+/,
    'withoutPatch': /\d+\.\d+/
};

const audioPlayer = new Audio();
audioPlayer.preservesPitch = false;

const getSoundsJsonUri = (revision) => {
    return soundsJsonUriTemplate.replace('${revision}', encodeURI(revision));
};

const getSoundsSchemaJsonUri = (revision) => {
    return soundsSchemaJsonUriTemplate.replace('${revision}', encodeURI(revision));
};

export default class ExtraSounds {
    static defaultRef = 'dev';
    /** @type {{ tag: string, commit_hash: string, minecraft_version: string}[]} */
    static revisions = [];

    /**
     * Plays the ogg file which specified by uri.
     *
     * @param {string} uri    Target destination.
     * @param {number} volume The volume value.
     * @param {number} pitch  The pitch value.
     */
    static async playSoundAsync(uri, volume = 1.0, pitch = 1.0) {
        audioPlayer.pause();
        audioPlayer.src = uri;
        audioPlayer.volume = MathHelper.clamp(volume, 0.0, 1.0);
        audioPlayer.playbackRate = MathHelper.clamp(pitch, 0.1, 2.0);
        return audioPlayer.play();
    }

    /**
     * Fetches the ExtraSounds tags from GitHub's API.
     *
     * @returns {Promise<{ tag: string, commit_hash: string, minecraft_version: string}[]>} Array of Tags in Promise.
     */
    static async fetchTagRevisionsAsync() {
        return fetch(gitHubTagsUri)
            .then(response => response.json())
            .then(json => {
                json.forEach(tag => {
                    const elem = {};
                    const tagName = tag['name'];
                    elem['tag'] = tagName;
                    elem['commit_hash'] = tag['commit']['sha'];
                    let mcVer = tagName.match(MCVerRegex['withPatch']);
                    if (!mcVer) {
                        mcVer = tagName.match(MCVerRegex['withoutPatch']);
                    }
                    if (!mcVer) {
                        return;
                    }
                    elem['minecraft_version'] = mcVer[0];
                    this.revisions.push(elem);
                });
                return this.revisions;
            }).catch(() => new Array());
    }

    /**
     * Fetches the sounds.json from GitHub's repository.
     *
     * @param {string} revision Target revision, can be commit SHA, branch name or tag name. Default is 'dev'.
     * @returns {Promise<SoundsJson>} The json object which parsed from sounds.json.
     */
    static async fetchSoundsJsonAsync(revision = this.defaultRef) {
        return fetch(getSoundsJsonUri(revision))
            .then(response => response.json())
            .then(json => fetch(json['download_url']))
            .then(response => response.json())
            .catch(() => new Object());
    }

    /**
     * Fetches the schema of sounds.json from GitHub's repository.
     *
     * @param {string} revision Target revision, can be commit SHA, branch name or tag name. Default is 'dev'.
     * @returns {Promise<object>} The json object which parsed from schema.json.
     */
    static async fetchSoundsJsonSchemaAsync(revision = this.defaultRef) {
        return fetch(getSoundsSchemaJsonUri(revision))
            .then(response => response.json())
            .then(json => fetch(json['download_url']))
            .then(response => response.json())
            .catch(() => new Object());
    }

    /**
     *
     * @param {string} esVer Target ExtraSounds version.
     * @returns Minecraft version string.
     */
    static getCompatMCVerFromExtraSoundsVer(esVer = this.defaultRef) {
        let mcVer = MinecraftAssets.latestVerStr;
        this.revisions.forEach(tag => {
            if (tag['tag'] !== esVer) {
                return;
            }
            mcVer = tag['minecraft_version'];
        });
        return mcVer;
    }

    /**
     *
     * @param {string} mcVer Target Minecraft version.
     * @returns ExtraSounds revision string.
     */
    static getLatestRevFromMCVer(mcVer = MinecraftAssets.latestVerStr) {
        const filtered = this.revisions.filter(rev => rev['minecraft_version'] === mcVer);
        const tags = Arrays.versionSort(filtered.map(rev => rev['tag']));
        return tags[0] ?? this.defaultRef;
    }

    /**
     * Attempts to get the vanilla sounds generated by ExtraSounds.
     *
     * @param {string} mcVer Target Minecraft version.
     * @returns {Promise<SoundsJson>} The task.
     */
    static async fetchAutoGenSoundsJsonAsync(mcVer) {
        let baseUri = `${location.protocol}//${location.host}${location.pathname}`;
        baseUri = baseUri.substring(0, baseUri.lastIndexOf('/'));
        return fetch(`${baseUri}/generated/${mcVer}.json`)
            .then(response => response.json());
    }
}
