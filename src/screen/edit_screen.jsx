'use strict';

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

const dropAreaDOMSelector = '.edit-json-editor [data-rbd-droppable-id=res-pack]';
const dropSourceId = 'extra-sounds';
const dropDestinationId = 'res-pack';
const dragCssClassName = 'dragging';
const dragCssErrorClassName = 'error';

const handleBeforeUnload = (ev) => {
    ev.preventDefault();
    ev.returnValue = '';
};

const registerUnloadConfirmation = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
};

/**
 * @param {{
 *      onChangeWaitState: (state: boolean) => void,
 *      initialSoundsJson: object,
 *      hidden: boolean,
 * }} props
 */
const EditScreen = (props) => {
    const { hidden, initialSoundsJson, onChangeWaitState } = props;

    /** @type {[object, React.Dispatch<object>]} */
    const [resSoundsJson, setResSoundsJson] = useState(initialSoundsJson);
    const [retargetDlgOpen, setRetargetDlgOpen] = useState(false);
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    /** @type {[number | false, React.Dispatch<number | false>]} */
    const [errorWhenPlaySound, setErrorWhenPlaySound] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        const currentPack = StateHandler.getResourcePack();
        const isPackChanged = (currentPack && currentPack.soundsJson) !== resSoundsJson;
        if (isPackChanged) {
            registerUnloadConfirmation();
        }
    }, [resSoundsJson]);

    const handlePlaySoundError = () => {
        if (errorWhenPlaySound) {
            clearTimeout(errorWhenPlaySound);
        }
        setErrorWhenPlaySound(setTimeout(() => setErrorWhenPlaySound(false), 5000));
    };

    const onPackRetargetClick = () => {
        setRetargetDlgOpen(true);
    };

    const onPackDownload = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        const resPack = StateHandler.getResourcePack();
        resPack.soundsJson = resSoundsJson;
        resPack.generateZip();
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
        StateHandler.reTartgetPack(esVer).catch((error) => {
            setSomeError(<>Failed to retarget ResourcePack. Reason: &ldquo;{error.message}&rdquo;</>);
        }).finally(() => {
            onChangeWaitState(false);
        });
    };

    const handleDragStart = (component) => {
        const dropAreaDOM = document.querySelector(dropAreaDOMSelector);
        dropAreaDOM.classList.add(dragCssClassName);
        if (resSoundsJson[component['draggableId']]) {
            dropAreaDOM.classList.add(dragCssErrorClassName);
        }
    };

    const handleDrop = (result) => {
        document.querySelector(dropAreaDOMSelector).classList.remove(dragCssClassName, dragCssErrorClassName);
        if (!result['destination'] || result['destination']['droppableId'] !== dropDestinationId) {
            return;
        }
        handleSourceItemClick(result['draggableId']);
    };

    /**
     * @param {string} entryName
     */
    const handleSourceItemClick = (entryName) => {
        const modSoundsJson = StateHandler.getModSoundsJson();
        const targetEnry = modSoundsJson['extrasounds'][entryName];
        if (!resSoundsJson[entryName] && targetEnry) {
            const newJson = { ...resSoundsJson };
            newJson[entryName] = targetEnry;
            newJson[entryName]['replace'] = true;
            setResSoundsJson(newJson);
        }
    };

    const handleEditableItemClick = () => {
    };

    const handleEditableItemDelete = (entryName) => {
        if (!resSoundsJson[entryName]) {
            return;
        }
        const newJson = { ...resSoundsJson };
        delete newJson[entryName];
        setResSoundsJson(newJson);
    };

    const handleEditableItemNameChange = (before, after) => {
        if (!resSoundsJson[before] || before === after) {
            return;
        }
        const newJson = { ...resSoundsJson };
        newJson[after] = newJson[before];
        delete newJson[before];
        setResSoundsJson(newJson);
    };

    /**
     * @param {string} entryName
     * @returns {boolean} Returns true if the entryName already exists.
     */
    const handleCheckEntryName = (entryName) => {
        return resSoundsJson[entryName] !== undefined;
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
                delete resSoundsJson[soundKey]['sounds'][soundEntryIndex][property];
            } else {
                resSoundsJson[soundKey]['sounds'][soundEntryIndex][property] = value;
            }
            registerUnloadConfirmation();
        } catch {
            // ignored statement.
            undefined;
        }
    };

    const handleAddItem = (entryName) => {
        const newJson = { ...resSoundsJson };
        newJson[entryName] = {
            'sounds': [''],
        };
        setResSoundsJson(newJson);
    };

    /**
     *
     * @param {string} entryName
     * @param {number} volume
     * @param {number} pitch
     * @param {boolean} isEvent
     */
    const handlePlaySound = async (entryName, volume, pitch, isEvent) => {
        return StateHandler.playSoundAsync(entryName, volume, pitch, isEvent).catch(() => {
            handlePlaySoundError();
        });
    };

    if (hidden) {
        return null;
    }

    return (!StateHandler.getResourcePack()) ? (
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
                            value={ StateHandler.getExtraSoundsVer() }
                            size='small'
                            variant='standard'
                            disabled
                            sx={ { maxWidth: '10em' } }
                        />
                        <TextField
                            label='Minecraft'
                            id='mc-ver'
                            value={ StateHandler.getResourcePack().getMCVerFromPackFormat() }
                            size='small'
                            variant='standard'
                            disabled
                            sx={ { maxWidth: '4em' } }
                        />
                        <TextField
                            label={ t('Format') }
                            id='pack-format-num'
                            value={ StateHandler.getResourcePack().getPackFormat() }
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
                            objects={ StateHandler.getModSoundsJson()['extrasounds'] ?? {} }
                            onItemClick={ handleSourceItemClick }
                            title='ExtraSounds'
                            id={ dropSourceId }
                            draggable
                        />
                        <SoundEntryVisualizer
                            objects={ resSoundsJson }
                            onItemClick={ handleEditableItemClick }
                            onItemDelete={ handleEditableItemDelete }
                            onItemNameChange={ handleEditableItemNameChange }
                            onItemValueChange={ handleEditableValueChange }
                            onItemAdd={ handleAddItem }
                            onPlaySound={ handlePlaySound }
                            checkEntryExists={ handleCheckEntryName }
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
