'use strict';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Button, TextField, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

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
        const [vanillaSoundsJson, setVanillaSoundsJson] = useState({});
        /** @type {[{extrasounds: object}, React.Dispatch<object>]} */
        const [modSoundsJson, setModSoundsJson] = useState({});
        /** @type {[string, React.Dispatch<string>]} */
        const [extraSoundsVer, setExtraSoundsVer] = useState(ExtraSounds.defaultRef);
        const [retargetDlgOpen, setRetargetDlgOpen] = useState(false);
        /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
        const [someError, setSomeError] = useState(null);
        /** @type {[number | false, React.Dispatch<number | false>]} */
        const [errorWhenPlaySound, setErrorWhenPlaySound] = useState(false);

        const { hidden, onChangeWaitState } = props;

        const { t } = useTranslation();

        /**
         * @param {MinecraftResPack} resPack
         * @param {string} extraSoundsVer
         * @returns {Promise<void>}
         */
        const updateJsonFromVersion = async (resPack, extraSoundsVer) => {
            const mcVer = resPack.getMCVerFromPackFormat();
            const tasks = [];
            tasks.push((async () => {
                await MinecraftAssets.getMCAssetsJsonAsync(mcVer)
                    .then(json => {
                        setVanillaAssetJson(json);
                    });
            })());
            tasks.push((async () => {
                await MinecraftAssets.getMCSoundsJsonAsync(mcVer)
                    .then(json => {
                        setVanillaSoundsJson(json);
                    });
            })());
            tasks.push((async () => {
                await ExtraSounds.fetchSoundsJsonAsync(extraSoundsVer).then(json => {
                    setModSoundsJson({ extrasounds: json });
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

        const handlePlaySoundError = () => {
            if (errorWhenPlaySound) {
                clearTimeout(errorWhenPlaySound);
            }
            setErrorWhenPlaySound(setTimeout(() => setErrorWhenPlaySound(false), 5000));
        };

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
                handlePlaySoundError();
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
                    throw new Error();
                }
                const blob = new Blob([data.value], { type: 'audio/ogg' });
                playSound(URL.createObjectURL(blob), volume, pitch);
            }).catch(() => {
                handlePlaySoundError();
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
                resPack.soundsJson[entryName] = modSoundsJson['extrasounds'][entryName];
                resPack.soundsJson[entryName]['replace'] = true;
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
            if (!resPack.soundsJson[before] || before === after) {
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
                } else {
                    resPack.soundsJson[soundKey]['sounds'][soundEntryIndex][property] = value;
                }
            } catch {
                notifyPackChange(resPack);
            }
        };

        /**
         *
         * @param {string} entryName
         * @param {number} volume
         * @param {number} pitch
         * @param {boolean} isEvent
         */
        const handlePlaySound = (entryName, volume, pitch, isEvent) => {
            let fileName = undefined, namespace = 'minecraft', path = undefined;
            const isVanilla = entryName.startsWith('minecraft:') || !(entryName.includes(':'));
            try {
                if (isEvent) {
                    let entryNamespace = undefined;
                    if (entryName.includes(':')) {
                        [entryNamespace, entryName] = entryName.split(':');
                    }
                    /** @type {{name: string, volume: number, pitch: number, weight: number, type: string}[]} */
                    const entries = (isVanilla) ?
                        vanillaSoundsJson[entryName]['sounds'] :
                        modSoundsJson[entryNamespace][entryName]['sounds'];
                    const pickedEntry = entries[Math.floor(Math.random() * entries.length)];
                    if ((typeof pickedEntry) === 'string') {
                        fileName = pickedEntry;
                    } else if (pickedEntry['type'] === 'event') {
                        const entryVolume = (pickedEntry['volume']) ? pickedEntry['volume'] : 1;
                        const entryPitch = (pickedEntry['pitch']) ? pickedEntry['pitch'] : 1;
                        handlePlaySound(pickedEntry['name'], volume * entryVolume, pitch * entryPitch, true);
                        return;
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

                if (fileName in vanillaAssetJson['objects']) {
                    playVanillaAsset(fileName, volume, pitch);
                } else {
                    playBlobInZip(`assets/${fileName}`, volume, pitch);
                }
            } catch {
                handlePlaySoundError();
            }
        };

        return (hidden) ? null : (
            (!resPack) ?
                (
                    <>
                        <div className='error-msg center'>{t('Something went wrong...')} <a href='#' onClick={ () => location.reload() }>{t('Please refresh this page.')}</a></div>
                        <div style={ { position: 'absolute', left: '50%' } }><SimpleBoxAnimator /></div>
                    </>
                ) : (
                    <>
                        <main>
                            <div className='edit-header'>
                                <div className='edit-info'>
                                    <Typography>{t('ResourcePack info:')}</Typography>
                                    <TextField
                                        label={ `ExtraSounds ${t('version')}` }
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
                                        label={ t('Format') }
                                        id='pack-format-num'
                                        value={ resPack ? resPack.getPackFormat() : '' }
                                        size='small'
                                        variant='standard'
                                        disabled
                                        sx={ { maxWidth: '3em' } }
                                    />
                                </div>
                                <div>
                                    <Tooltip title={ t('EXPERIMENTAL: This functionality is not completed yet.') } arrow>
                                        <Button variant='outlined' onClick={ onPackRetargetClick }>{t('Retarget *')}</Button>
                                    </Tooltip>
                                </div>
                                <div><Button variant='contained' color='success' onClick={ onPackDownload }>{t('Download Zip')}</Button></div>
                            </div>
                            <div className='edit-json-editor'>
                                <DragDropContext onDragStart={ handleDragStart } onDragEnd={ handleDrop }>
                                    <SoundEntryVisualizer
                                        objects={ modSoundsJson['extrasounds'] ? modSoundsJson['extrasounds'] : {} }
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
                                        onPlaySound={ handlePlaySound }
                                        errorWhenPlaySound={ errorWhenPlaySound }
                                        title={ t('ResourcePack') }
                                        id={ dropDestinationId }
                                        editable
                                    />
                                </DragDropContext>
                            </div>
                            <div className='error-msg center'>{someError}</div>
                        </main>
                        <SimpleDialog
                            title={ t('Retarget ResourcePack') }
                            values={ [ExtraSounds.defaultRef, ...ExtraSounds.revisions.map(tag => tag['tag'])] }
                            isOpen={ retargetDlgOpen }
                            selectedValue={ extraSoundsVer }
                            onClose={ onRetargetDlgClose }
                            okString={ t('Execute') }
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
