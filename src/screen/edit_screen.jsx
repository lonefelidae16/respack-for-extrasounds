'use strict';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PropTypes from 'prop-types';

import ExtraSounds from '../model/extra_sounds.js';
import MinecraftAssets from '../model/minecraft_assets.js';
import MinecraftResPack from '../model/minecraft_res_pack.js';

const EditScreen = forwardRef((props, ref) => {
    /** @type {[MinecraftResPack, React.Dispatch<MinecraftResPack>]} */
    const [resPack, setResPack] = useState(null);
    /** @type {[object, React.Dispatch<object>]} */
    const [vanillaAssetJson, setVanillaAssetJson] = useState({});

    useImperativeHandle(ref, () => ({
        /**
         * Needs to be called to begin editing the ResourcePack.
         *
         * @param {MinecraftResPack} resPack Target ResourcePack.
         * @param {object} vanillaAssetJson  Target vanilla asset object.
         */
        withState: (resPack, vanillaAssetJson) => {
            setResPack(resPack);
            setVanillaAssetJson(vanillaAssetJson);
        }
    }));

    /**
     * Retrieves the SHA of vanilla asset from its file name.
     *
     * @param {string} fileName Target file name.
     * @returns {string | undefined} The SHA hash when succeeded.
     */
    const getAssetHash = (fileName) => {
        try {
            return vanillaAssetJson['objects'][fileName]['hash'];
        } catch {
            return undefined;
        }
    };

    /**
     * Playbacks the specified uri.
     *
     * @param {string} uri    Target to playback.
     * @param {number} volume The volume.
     * @param {number} pitch  The pitch.
     */
    const playSound = (uri, volume, pitch) => {
        ExtraSounds.playSound(uri, volume, pitch);
    };

    /**
     * Playbacks the specified Minecraft vanilla asset file.
     *
     * @param {string} fileName Target file name, like 'minecraft/sounds/block/amethyst/break1.ogg'.
     * @param {number} volume   The volume.
     * @param {number} pitch    The pitch.
     */
    const playVanillaAsset = (fileName, volume, pitch) => {
        const hash = getAssetHash(fileName);
        if (!hash) {
            return;
        }
        playSound(MinecraftAssets.getResourceUri(hash), volume, pitch);
    };

    /**
     * Playbacks the file located in ResourcePack zip.
     *
     * @param {string} fileName Target file name, like 'assets/namespace/sounds/custom/sound.ogg'.
     * @param {number} volume   The volume.
     * @param {number} pitch    The pitch.
     */
    const playBlobInZip = (fileName, volume, pitch) => {
        resPack.getFile(fileName, 'uint8array').then(data => {
            if (!data) {
                return;
            }
            const blob = new Blob([data.value], { type: 'audio/ogg' });
            playSound(URL.createObjectURL(blob), volume, pitch);
        });
    };

    return (props.hidden) ? null : (
        <main>
        Hi, I am EditScreen! I can only provide the specified ResourcePack at the moment, <a href='#' onClick={ () => resPack.generateZip() }>do you want to download it?</a>
        </main>
    );
});

EditScreen.displayName = 'EditScreen';

EditScreen.propTypes = {
    hidden: PropTypes.bool,
    resPack: PropTypes.object,
};

export default EditScreen;
