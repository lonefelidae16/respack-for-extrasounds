'use strict';

/** @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson */

import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Button, TextField, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import ExtraSounds from '../model/extra_sounds.js';
import { StateHandler } from '../util/globals.js';

import SimpleBoxAnimator from '../components/simple_box_animator.jsx';
import SimpleDialog from '../components/simple_dialog.jsx';
import SoundEntryVisualizer from '../components/sound_entry_visualizer.jsx';
import Arrays from '../util/arrays.js';
import MinecraftAssets from '../model/minecraft_assets.js';

const dropAreaDOMSelector = '.edit-json-editor [data-rbd-droppable-id=res-pack]';
const dropSourceId = 'extra-sounds';
const dropDestinationId = 'res-pack';
const dragCssClassName = 'dragging';
const dragCssErrorClassName = 'error';

/**
 * Prevents unloading this page.
 *
 * @param {BeforeUnloadEvent} ev
 */
const handleBeforeUnload = (ev) => {
    ev.preventDefault();
    ev.returnValue = '';
};

/**
 * Registers displaying confirmation dialog.
 */
const registerUnloadConfirmation = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
};

/**
 * Removes displaying confirmation dialog.
 */
const unregisterUnloadConfirmation = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
};

/**
 * @param {{
 *      onChangeWaitState: (state: boolean) => void,
 *      initialSoundsJson: SoundsJson,
 *      hidden: boolean,
 * }} props
 */
const EditScreen = (props) => {
    const { hidden, initialSoundsJson, onChangeWaitState } = props;

    const [resSoundsJson, setResSoundsJson] = useState(initialSoundsJson);
    const [retargetDlgOpen, setRetargetDlgOpen] = useState(false);
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    const [destinationSelectedItem, setDestinationSelectedItem] = useState('');

    const { t } = useTranslation();

    useEffect(() => {
        const currentPack = StateHandler.getResourcePack();
        if (!currentPack) {
            return;
        }
        if (currentPack.soundsJson !== resSoundsJson) {
            registerUnloadConfirmation();
        } else {
            unregisterUnloadConfirmation();
        }
    }, [resSoundsJson]);

    useEffect(() => {
        setResSoundsJson(initialSoundsJson);
    }, [initialSoundsJson]);

    /**
     * Opens Retarget dialog.
     */
    const onPackRetargetClick = () => {
        setRetargetDlgOpen(true);
    };

    /**
     * Gets the Zip and unregisters unloading dialog.
     */
    const onPackDownload = () => {
        MinecraftAssets.getEmptySoundEntry(resSoundsJson).then(result => {
            if (result.length === 0) {
                unregisterUnloadConfirmation();
                const resPack = StateHandler.getResourcePack();
                resPack.soundsJson = resSoundsJson;
                resPack.generateZip();
            } else {
                setDestinationSelectedItem(result[0]);
            }
        });
    };

    /**
     * Tries to retartget this ResourcePack.
     *
     * @param {string} esVer
     */
    const onRetargetDlgClose = async (esVer) => {
        setRetargetDlgOpen(false);
        if (!esVer || StateHandler.getExtraSoundsVer() === esVer) {
            return;
        }
        onChangeWaitState(true);
        StateHandler.retartgetPack(esVer).catch((error) => {
            setSomeError(<>{t('Failed to retarget ResourcePack.')} {t('Reason:')} &ldquo;{error.message}&rdquo;</>);
        }).finally(() => {
            onChangeWaitState(false);
        });
    };

    /**
     * Handles start dragging provided by react-beautiful-dnd.
     *
     * @param {import('react-beautiful-dnd').DragStart} component Target element.
     */
    const handleDragStart = (component) => {
        const dropAreaDOM = document.querySelector(dropAreaDOMSelector);
        dropAreaDOM.classList.add(dragCssClassName);
        if (resSoundsJson[component['draggableId']]) {
            dropAreaDOM.classList.add(dragCssErrorClassName);
        }
    };

    /**
     * Handles mouse-up event provided by react-beautiful-dnd.
     *
     * @param {import('react-beautiful-dnd').DropResult} result The result.
     */
    const handleDrop = (result) => {
        document.querySelector(dropAreaDOMSelector).classList.remove(dragCssClassName, dragCssErrorClassName);
        if (!result['destination'] || result['destination']['droppableId'] !== dropDestinationId) {
            return;
        }
        handleSourceItemClick(result['draggableId']);
    };

    /**
     * Attempts source json entry copy.
     *
     * @param {string} entryName Target entry name.
     */
    const handleSourceItemClick = (entryName) => {
        const targetEntry = StateHandler.getModSoundsJson()['extrasounds'][entryName];
        if (!resSoundsJson[entryName] && targetEntry) {
            setResSoundsJson(current => {
                const newJson = { ...current };
                newJson[entryName] = structuredClone(targetEntry);
                newJson[entryName]['replace'] = true;
                return newJson;
            });
        } else {
            setDestinationSelectedItem(entryName);
        }
    };

    /**
     * Unused.
     */
    const handleEditableItemClick = () => {
    };

    /**
     * Attempts to delete destination json entry.
     *
     * @param {string} entryName Traget entry name.
     */
    const handleEditableItemDelete = (entryName) => {
        if (!resSoundsJson[entryName]) {
            return;
        }
        setResSoundsJson(current => {
            const newJson = { ...current };
            delete newJson[entryName];
            return newJson;
        });
    };

    /**
     * Attempts to rename json entry.
     *
     * @param {string} before Target json entry.
     * @param {string} after  The replacement entry name.
     */
    const handleEditableItemNameChange = (before, after) => {
        if (!resSoundsJson[before] || before === after) {
            return;
        }
        setResSoundsJson(current => {
            const newJson = { ...current };
            newJson[after] = newJson[before];
            delete newJson[before];
            return newJson;
        });
    };

    /**
     * Checks if the specified entry name exists.
     *
     * @param {string} entryName Target entry name.
     * @returns {boolean} Returns true if the entryName already exists.
     */
    const handleCheckEntryName = (entryName) => {
        return resSoundsJson[entryName] !== undefined;
    };

    /**
     * Attempts to change the json entry.
     *
     * @param {{
    *      soundEntry: string,
    *      soundEntryIndex: number,
    *      property: string,
    *      value: any
    * }} param0 Target parameters.
    */
    const handleEditableValueChange = ({ soundEntry, soundEntryIndex, property, value }) => {
        try {
            let target = resSoundsJson[soundEntry]['sounds'][soundEntryIndex];
            if (typeof target === 'string') {
                target = { 'name': target };
            }
            if (value === null) {
                delete target[property];
            } else {
                target[property] = value;
            }
            resSoundsJson[soundEntry]['sounds'][soundEntryIndex] = target;
        } catch {
            // ignored statement.
            undefined;
        }
    };

    /**
     * Attempts to add the entry name to json.
     *
     * @param {string} entryName Target entry name.
     */
    const handleAddEntry = (entryName) => {
        setResSoundsJson(current => {
            const newJson = { ...current };
            newJson[entryName] = {
                'sounds': [{ 'name': '' }],
            };
            return newJson;
        });
    };

    /**
     * Attempts to add a new element to array in json entry.
     *
     * @param {string} entryName Target entry name.
     */
    const handleAddSoundToEntry = (entryName) => {
        if (!resSoundsJson[entryName]) {
            return;
        }
        setResSoundsJson(current => {
            const newJson = { ...current };
            newJson[entryName]['sounds'].push({ 'name': '' });
            return newJson;
        });
    };

    /**
     * Attempts to remove element from array in json entry.
     *
     * @param {string} entryName Target entry name.
     * @param {number} index     Target array index to remove.
     */
    const handleRemoveSoundFromEntry = (entryName, index) => {
        if (!resSoundsJson[entryName] || !resSoundsJson[entryName]['sounds']) {
            return;
        }
        setResSoundsJson(current => {
            const newJson = { ...current };
            const sounds = newJson[entryName]['sounds'];
            delete sounds[index];
            newJson[entryName]['sounds'] = Arrays.filterNonNull(sounds);
            return newJson;
        });
    };

    if (hidden) {
        return null;
    }

    const resPack = StateHandler.getResourcePack();
    if (!resPack) {
        return (
            <>
                <div className='error-msg center'>{t('Something went wrong...')} <a href='#' onClick={ () => location.reload() }>{t('Please refresh this page.')}</a></div>
                <div style={ { position: 'absolute', left: '50%' } }><SimpleBoxAnimator /></div>
            </>
        );
    }

    const mcVer = resPack.getMCVer();
    const format = resPack.getPackFormat();
    const isValidPackFormat = resPack.checkExactPackFormat(mcVer);
    return (
        <>
            <main>
                <div className='edit-header'>
                    <div className='edit-info'>
                        <Typography>{t('ResourcePack info:')}</Typography>
                        <TextField
                            label={ `ExtraSounds ${t('version')}` }
                            id='es-ver'
                            value={ StateHandler.getExtraSoundsVer() }
                            size='small'
                            variant='standard'
                            disabled
                            sx={ { maxWidth: '10em' } }
                        />
                        <TextField
                            label='Minecraft'
                            id='mc-ver'
                            value={ mcVer }
                            size='small'
                            variant='standard'
                            disabled
                            sx={ { maxWidth: '4em' } }
                        />
                        <Tooltip
                            title={
                                !isValidPackFormat ?
                                    t('Format %d is incompatible with Minecraft %s.')
                                        .replace('%d', format)
                                        .replace('%s', mcVer) :
                                    ''
                            }
                            arrow>
                            <TextField
                                label={ t('Format') }
                                id='pack-format-num'
                                value={ format }
                                size='small'
                                variant='standard'
                                error={ !isValidPackFormat }
                                disabled
                                sx={ { maxWidth: '3em' } }
                            />
                        </Tooltip>
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
                            objects={ StateHandler.getModSoundsJson()['extrasounds'] ?? {} }
                            onItemClick={ handleSourceItemClick }
                            title='ExtraSounds'
                            id={ dropSourceId }
                            limitCount={ 100 }
                            draggable
                        />
                        <SoundEntryVisualizer
                            objects={ resSoundsJson }
                            options={ StateHandler.getSoundNameList() }
                            onItemClick={ handleEditableItemClick }
                            onEntryDelete={ handleEditableItemDelete }
                            onEntryNameChange={ handleEditableItemNameChange }
                            onItemValueChange={ handleEditableValueChange }
                            onEntryAdd={ handleAddEntry }
                            onSoundAddToEntry={ handleAddSoundToEntry }
                            onSoundRemoveFromEntry={ handleRemoveSoundFromEntry }
                            checkEntryExists={ handleCheckEntryName }
                            title={ t('ResourcePack') }
                            id={ dropDestinationId }
                            limitCount={ 10 }
                            searchFilter={ destinationSelectedItem }
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
                selectedValue={ StateHandler.getExtraSoundsVer() }
                onClose={ onRetargetDlgClose }
                okString={ t('Execute') }
            />
        </>
    );
};

EditScreen.displayName = 'EditScreen';

EditScreen.propTypes = {
    hidden: PropTypes.bool,
    initialSoundsJson: PropTypes.object.isRequired,
    onChangeWaitState: PropTypes.func,
};

export default EditScreen;
