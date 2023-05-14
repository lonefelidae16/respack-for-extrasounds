'use strict';

import MathHelper from '../util/math_helper';

const soundsJsonUriTemplate = 'https://api.github.com/repos/lonefelidae16/extra-sounds/contents/src/main/resources/assets/extrasounds/sounds.json?ref=${revision}';

const gitHubTagsUri = 'https://api.github.com/repos/lonefelidae16/extra-sounds/tags';

const MCVerRegex = {
    'withPatch': /\d+\.\d+\.\d+/,
    'withoutPatch': /\d+\.\d+/
};

const player = new Audio();
player.preservesPitch = false;

const getSoundsJsonUri = function (revision) {
    return soundsJsonUriTemplate.replace('${revision}', encodeURI(revision));
};

export default class ExtraSounds {
    /**
     * Plays the ogg file which specified by uri.
     *
     * @param {string} uri    Target destination.
     * @param {number} volume The volume value.
     * @param {number} pitch  The pitch value.
     */
    static playSound(uri, volume = 1.0, pitch = 1.0) {
        player.pause();
        player.src = uri;
        player.volume = volume;
        player.playbackRate = MathHelper.clamp(pitch, 0.1, 2.0);
        player.play();
    }

    /**
     * Fetches the ExtraSounds tags from GitHub's API.
     *
     * @returns {Promise<array>} Array of Tags in Promise.
     */
    static async fetchTagRevisions() {
        try {
            const json = await fetch(gitHubTagsUri).then(response => response.json());
            const ret = [];
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
                    return [];
                }
                elem['minecraft_version'] = mcVer[0];
                ret.push(elem);
            });
            return ret;
        } catch {
            return [];
        }
    }

    /**
     * Fetches the sounds.json from GitHub's repository.
     *
     * @param {string} revision Target revision, can be commit SHA, branch name or tag name. Default is 'dev'.
     * @returns {Promise<object>} The json object which parsed from sounds.json.
     */
    static async readSoundsJsonAsync(revision = 'dev') {
        try {
            return await fetch(getSoundsJsonUri(revision))
                .then(response => response.json())
                .then(json => fetch(json['download_url']))
                .then(response => response.json());
        } catch {
            return {};
        }
    }
}
