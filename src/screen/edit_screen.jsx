'use strict';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Button, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import ExtraSounds from '../model/extra_sounds.js';
import MinecraftAssets from '../model/minecraft_assets.js';
import MinecraftResPack from '../model/minecraft_res_pack.js';

import SimpleBoxAnimator from '../components/simple_box_animator.jsx';
import SimpleDialog from '../components/simple_dialog.jsx';

const EditScreen = forwardRef(
    /**
     * @param {{
     *      onChangeWaitState: (state: boolean) => void,
     * }} props
     */
    (props, ref) => {
        /** @type {[MinecraftResPack, React.Dispatch<MinecraftResPack>]} */
        const [resPack, setResPack] = useState(null);
        /** @type {[object, React.Dispatch<object>]} */
        const [vanillaAssetJson, setVanillaAssetJson] = useState({});
        /** @type {[object, React.Dispatch<object>]} */
        const [extraSoundsJson, setExtraSoundsJson] = useState({});
        /** @type {[object, React.Dispatch<object>]} */
        const [soundsJsonSchema, setSoundsJsonSchema] = useState({});
        /** @type {[string, React.Dispatch<string>]} */
        const [extraSoundsVer, setExtraSoundsVer] = useState(ExtraSounds.defaultRef);
        const [retargetDlgOpen, setRetargetDlgOpen] = useState(false);
        /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
        const [someError, setSomeError] = useState(null);

        const { onChangeWaitState } = props;

        /**
         * @param {MinecraftResPack} resPack
         * @param {string} extraSoundsVer
         * @returns {Promise<void>}
         */
        const updateJsonFromVersion = async (resPack, extraSoundsVer) => {
            const tasks = [];
            tasks.push((async () => {
                await MinecraftAssets.getAllMCAssetsJsonAsync(resPack.getMCVerFromPackFormat())
                    .then(json => {
                        setVanillaAssetJson(json);
                    });
            })());
            tasks.push((async () => {
                await ExtraSounds.fetchSoundsJsonAsync(extraSoundsVer).then(json => {
                    setExtraSoundsJson(json);
                });
            })());
            tasks.push((async () => {
                await ExtraSounds.fetchSoundsJsonSchemaAsync(extraSoundsVer).then(json => {
                    setSoundsJsonSchema(json);
                });
            })());
            return Promise.all(tasks);
        };

        useImperativeHandle(ref, () => ({
            withState: async (obj) => {
                setResPack(obj.resPack);
                setExtraSoundsVer(obj.extraSoundsVer);
                return updateJsonFromVersion(obj.resPack, obj.extraSoundsVer);
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

        const onPackRetargetClick = () => {
            setRetargetDlgOpen(true);
        };

        /**
         * Tries to retartget this ResourcePack.
         *
         * @param {string} esVer
         */
        const onRetargetDlgClose = (esVer) => {
            setRetargetDlgOpen(false);
            if (!esVer || extraSoundsVer === esVer) {
                return;
            }
            onChangeWaitState(true);
            try {
            // Change ExtraSounds version.
                setExtraSoundsVer(esVer);
                // Retrieve compatible Minecraft version of ExtraSounds.
                const mcVersion = ExtraSounds.getCompatMCVerFromExtraSoundsVer(esVer);
                // Update pack_format.
                resPack.setPackFormatFromMCVer(mcVersion);
                // Obtain sounds.json by version.
                (async () => await updateJsonFromVersion(resPack, esVer))();
            // TODO: Check missing sound entry when pack_format downgraded
            } catch (error) {
                setSomeError(<>Failed to retarget ResourcePack. Reason: &ldquo;{error.message}&rdquo;</>);
            } finally {
                onChangeWaitState(false);
            }
        };

        return (props.hidden) ? null : (
            (!resPack /* false */) ?
                (
                    <>
                        <div className='error-msg center'>Something went wrong... <a href='#' onClick={ () => location.reload() }>Please refresh this page.</a></div>
                        <div style={ { position: 'absolute', left: '50%' } }><SimpleBoxAnimator /></div>
                    </>
                ) : (
                    <main>
                        <div className='edit-header'>
                            <div className='edit-info'>
                                <div>ResourcePack info:</div>
                                <TextField
                                    label='ExtraSounds version'
                                    id='es-ver'
                                    value={ extraSoundsVer }
                                    size='small'
                                    variant='standard'
                                    disabled
                                    sx={ { maxWidth: '10em' } }
                                />
                                <TextField
                                    label='Minecraft'
                                    id='mc-ver'
                                    value={ resPack ? resPack.getMCVerFromPackFormat() : '' }
                                    size='small'
                                    variant='standard'
                                    disabled
                                    sx={ { maxWidth: '4em' } }
                                />
                                <TextField
                                    label='Format'
                                    id='pack-format-num'
                                    value={ resPack ? resPack.getPackFormat() : '' }
                                    size='small'
                                    variant='standard'
                                    disabled
                                    sx={ { maxWidth: '3em' } }
                                />
                            </div>
                            <div><Button variant='outlined' onClick={ onPackRetargetClick }>Retarget</Button></div>
                        </div>
                        <SimpleDialog
                            title='Retarget ResourcePack'
                            values={ [ExtraSounds.defaultRef, ...ExtraSounds.revisions.map(tag => tag['tag'])] }
                            isOpen={ retargetDlgOpen }
                            selectedValue={ extraSoundsVer }
                            onClose={ onRetargetDlgClose }
                            okString='Execute'
                        />
                    Hi, I am EditScreen! I can only provide the specified ResourcePack at the moment, <a href='#' onClick={ () => resPack.generateZip() }>do you want to download it?</a>
                        <div className='error-msg center'>{someError}</div>
                    </main>
                )
        );
    }
);

EditScreen.displayName = 'EditScreen';

EditScreen.propTypes = {
    hidden: PropTypes.bool,
    name: PropTypes.string,
    onChangeWaitState: PropTypes.func,
};

export default EditScreen;
