'use strict';

import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Button, TextField } from '@mui/material';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';

import ExtraSounds from '../model/extra_sounds.js';
import MinecraftAssets from '../model/minecraft_assets.js';
import MinecraftResPack from '../model/minecraft_res_pack.js';

import SimpleBoxAnimator from '../components/simple_box_animator.jsx';
import SimpleDialog from '../components/simple_dialog.jsx';
import SoundEntryVisualizer from '../components/sound_entry_visualizer.jsx';

const EditScreen = forwardRef(
    /**
     * @param {{
     *      onChangeWaitState: (state: boolean) => void,
     *      hidden: boolean,
     * }} props
     */
    (props, ref) => {
        /** @type {[MinecraftResPack, React.Dispatch<MinecraftResPack>]} */
        const [resPack, setResPack] = useState(null);
        /** @type {[object, React.Dispatch<object>]} */
        const [vanillaAssetJson, setVanillaAssetJson] = useState({});
        /** @type {[object, React.Dispatch<object>]} */
        const [extraSoundsJson, setExtraSoundsJson] = useState({});
        /** @type {[string, React.Dispatch<string>]} */
        const [extraSoundsVer, setExtraSoundsVer] = useState(ExtraSounds.defaultRef);
        const [retargetDlgOpen, setRetargetDlgOpen] = useState(false);
        /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
        const [someError, setSomeError] = useState(null);

        const { hidden, onChangeWaitState } = props;

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

        const onPackDownload = () => {
            resPack.generateZip();
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

        const dropSourceId = 'extra-sounds';
        const dropDestinationId = 'res-pack';
        const dragCssClassName = 'dragging';

        const handleDragStart = () => {
            document.querySelector('.edit-json-editor [data-rbd-droppable-id=res-pack]').classList.add(dragCssClassName);
        };

        const handleDrop = (result) => {
            document.querySelector('.edit-json-editor [data-rbd-droppable-id=res-pack]').classList.remove(dragCssClassName);
            if (!resPack) {
                return;
            }
            if (!result['destination'] || result['destination']['droppableId'] !== dropDestinationId) {
                return;
            }
            handleSourceItemClick(result['draggableId']);
        };

        /**
         * @param {MinecraftResPack} newPack
         */
        const notifyPackChange = (newPack) => {
            const createNew = new MinecraftResPack();
            Object.assign(createNew, newPack);
            setResPack(createNew);
        };

        /**
         * @param {string} entryName
         */
        const handleSourceItemClick = (entryName) => {
            if (!resPack.soundsJson[entryName]) {
                resPack.soundsJson[entryName] = extraSoundsJson[entryName];
                notifyPackChange(resPack);
            }
        };

        const handleEditableItemClick = () => {
        };

        const handleEditableItemDelete = (entryName) => {
            if (!resPack.soundsJson[entryName]) {
                return;
            }

            delete resPack.soundsJson[entryName];
            notifyPackChange(resPack);
        };

        const handleEditableItemNameChange = (before, after) => {
            if (!resPack.soundsJson[before]) {
                return;
            }

            resPack.soundsJson[after] = resPack.soundsJson[before];
            delete resPack.soundsJson[before];
            notifyPackChange(resPack);
        };

        /**
         * @param {{
         *      soundKey: string,
         *      soundEntryIndex: number,
         *      property: string,
         *      value: any
         * }} obj
         */
        const handleEditableValueChange = (obj) => {
            try {
                const { soundKey, soundEntryIndex, property, value } = obj;
                if (value === null) {
                    delete resPack.soundsJson[soundKey]['sounds'][soundEntryIndex][property];
                    notifyPackChange(resPack);
                } else {
                    resPack.soundsJson[soundKey]['replace'] = true;
                    resPack.soundsJson[soundKey]['sounds'][soundEntryIndex][property] = value;
                    notifyPackChange(resPack);
                }
            } catch {
                notifyPackChange(resPack);
            }
        };

        return (hidden) ? null : (
            (!resPack) ?
                (
                    <>
                        <div className='error-msg center'>Something went wrong... <a href='#' onClick={ () => location.reload() }>Please refresh this page.</a></div>
                        <div style={ { position: 'absolute', left: '50%' } }><SimpleBoxAnimator /></div>
                    </>
                ) : (
                    <>
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
                                <div><Button variant='contained' color='success' onClick={ onPackDownload }>Download Zip</Button></div>
                            </div>
                            <div className='edit-json-editor'>
                                <DragDropContext onDragStart={ handleDragStart } onDragEnd={ handleDrop }>
                                    <SoundEntryVisualizer
                                        objects={ extraSoundsJson }
                                        onItemClick={ handleSourceItemClick }
                                        title='ExtraSounds'
                                        id={ dropSourceId }
                                        draggable
                                    />
                                    <SoundEntryVisualizer
                                        objects={ resPack ? resPack.soundsJson : {} }
                                        onItemClick={ handleEditableItemClick }
                                        onItemDelete={ handleEditableItemDelete }
                                        onItemNameChange={ handleEditableItemNameChange }
                                        onItemValueChange={ handleEditableValueChange }
                                        title='ResourcePack'
                                        id={ dropDestinationId }
                                        editable
                                    />
                                </DragDropContext>
                            </div>
                            <div className='error-msg center'>{someError}</div>
                        </main>
                        <SimpleDialog
                            title='Retarget ResourcePack'
                            values={ [ExtraSounds.defaultRef, ...ExtraSounds.revisions.map(tag => tag['tag'])] }
                            isOpen={ retargetDlgOpen }
                            selectedValue={ extraSoundsVer }
                            onClose={ onRetargetDlgClose }
                            okString='Execute'
                        />
                    </>
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
