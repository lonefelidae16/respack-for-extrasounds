'use strict';

import { versionSort } from '../util/versions';

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
    static playSound(uri, volume = 1.0, pitch = 1.0) {
        if (pitch < 0.1) {
            pitch = 0.1;
        }
        player.pause();
        player.src = uri;
        player.volume = volume;
        player.playbackRate = pitch;
        player.play();
    }

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
                    console.error(`failed to parse MCVersion from tag: '${tagName}'`);
                    return;
                }
                elem['minecraft_version'] = mcVer[0];
                ret.push(elem);
            });
            return ret;
        } catch {
            return [];
        }
    }

    static async fetchCompatibleMCVers() {
        try {
            const revisions = await this.fetchTagRevisions();
            const mcVers = {};
            revisions.forEach(tag => {
                mcVers[tag['minecraft_version']] = true;
            });
            return versionSort(Object.keys(mcVers));
        } catch {
            return [];
        }
    }

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
