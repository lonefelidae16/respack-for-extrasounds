'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControlLabel, IconButton, List, Slider, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Delete, Edit, MusicNoteOutlined, MusicOff } from '@mui/icons-material';

/**
 * @param {{
 *      sounds: array,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      onPlaySound: (entryName: string, volume: number, pitch: number, isEvent: boolean) => void,
 *      onAccordionClick: (value: string) => void,
 *      id: string,
 *      editable: boolean,
 *      isOpen: boolean,
 * }} props
 */
const SoundEntryEditor = (props) => {
    const { sounds, id, onItemDelete, onItemNameChange, onItemValueChange, onAccordionClick, onPlaySound, editable, isOpen, errorWhenPlaySound } = props;
    const [entryNameEditorShow, setEntryNameEditorShow] = useState(false);
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [editingEntryName, setEditingEntryName] = useState(false);
    const [soundName, setSoundName] = useState(sounds.map(entry => ((typeof entry) === 'string') ? entry : entry['name']));
    const [volume, setVolume] = useState(sounds.map(entry => (entry['volume'] ? entry['volume'] : 1)));
    const [pitch, setPitch] = useState(sounds.map(entry => (entry['pitch'] ? entry['pitch'] : 1)));
    const [isEvent, setEvent] = useState(sounds.map(entry => entry['type'] === 'event'));

    const handleListItemClick = (entryName) => {
        onAccordionClick(entryName);
    };

    const handleItemDelete = (entryName) => {
        if (onItemDelete) {
            onItemDelete(entryName);
        }
        onAccordionClick(false);
        setEditingEntryName(false);
        setEntryNameEditorShow(false);
    };

    const handleNameEdit = (currentName) => {
        setEditingEntryName(currentName);
        setEntryNameEditorShow(true);
        setTimeout(() => document.getElementById(`entry-editor-${currentName}`).focus(), 66);
    };

    /**
     * @param {React.KeyboardEvent} ev
     */
    const handleEntryNameEditor = (ev) => {
        if (ev.key.match(/^enter$/i)) {
            handleItemNameChange(ev.target.value);
        }
        if (ev.key.match(/^escape$/i)) {
            handleItemNameChange(null);
        }
    };

    const handleItemNameChange = (newName) => {
        if (onItemNameChange && newName !== null) {
            onItemNameChange(editingEntryName, newName);
        }
        setEditingEntryName(false);
        setEntryNameEditorShow(false);
    };

    /**
     * @param {{
     *      soundKey: string,
     *      soundEntryIndex: number,
     *      property: string,
     *      value: any
     * }} obj
     */
    const handleValueChange = (obj) => {
        if (onItemValueChange) {
            onItemValueChange(obj);
        }
    };

    const handleSoundNameChange = (index, value) => {
        const current = [...soundName];
        current[index] = value;
        setSoundName(current);
        handleValueChange({ soundKey: id, soundEntryIndex: index, property: 'name', value });
    };

    const handleVolumeChange = (index, value) => {
        const current = [...volume];
        current[index] = value;
        setVolume(current);
    };

    const handlePitchChange = (index, value) => {
        const current = [...pitch];
        current[index] = value;
        setPitch(current);
    };

    const handleSoundTypeChange = (index, checked) => {
        const current = [...isEvent];
        current[index] = checked;
        setEvent(current);
        handleValueChange({ soundKey: id, soundEntryIndex: index, property: 'type', value: (checked ? 'event' : null) });
    };

    const handlePlaySound = (index) => {
        if (onPlaySound) {
            onPlaySound(soundName[index], volume[index], pitch[index], isEvent[index]);
        }
    };

    const classPrefix = 'sound-entry-editor';

    return (
        <Accordion expanded={ isOpen }>
            <AccordionSummary onClick={ () => handleListItemClick(id) }>
                <div style={ { display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' } }>
                    <div hidden={ !editable } className={ `${classPrefix}-edit-entry` }>
                        <Tooltip title={ `Edit the key name: "${id}"` } arrow>
                            <IconButton onClick={ (ev) => {
                                handleNameEdit(id);
                                ev.stopPropagation();
                            } }>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div style={ { flexGrow: 1 } } className={ `${classPrefix}-entry-name` }>
                        <Typography hidden={ entryNameEditorShow && editingEntryName === id }>{id}</Typography>
                        <div hidden={ !(entryNameEditorShow && editingEntryName === id) }>
                            <TextField
                                label='Entry'
                                defaultValue={ id }
                                margin='dense'
                                id={ `entry-editor-${id}` }
                                variant='standard'
                                onKeyDown={ handleEntryNameEditor }
                                onBlur={ () => handleItemNameChange(null) }
                            />
                        </div>
                    </div>
                    <div hidden={ !editable } className={ `${classPrefix}-remove-entry` }>
                        <Tooltip title='Remove this entry' arrow>
                            <IconButton onClick={ (ev) => {
                                handleItemDelete(id);
                                ev.stopPropagation();
                            } }>
                                <Delete color='error' />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>
            </AccordionSummary>
            <AccordionDetails>
                {sounds.map((soundEntry, index) => (
                    <List key={ `${id}-sound${index}` }>
                        <TextField
                            key={ `${id}-sound${index}-name` }
                            label='Name'
                            size='small'
                            variant='standard'
                            value={ soundName[index] }
                            fullWidth
                            sx={ { marginBottom: '1em' } }
                            disabled={ !editable }
                            onChange={ (ev) => handleSoundNameChange(index, ev.target.value) }
                        />
                        <Stack>
                            <small>Volume</small>
                            <Slider
                                value={ volume[index] }
                                size='small'
                                valueLabelDisplay='auto'
                                step={ 0.01 }
                                min={ 0 }
                                max={ 1 }
                                onChange={ (ev, value) => handleVolumeChange(index, value) }
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundKey: id, soundEntryIndex: index, property: 'volume', value }) }
                                disabled={ !editable }
                            />
                        </Stack>
                        <Stack>
                            <small>Pitch</small>
                            <Slider
                                value={ pitch[index] }
                                size='small'
                                valueLabelDisplay='auto'
                                step={ 0.01 }
                                min={ 0.1 }
                                max={ 2 }
                                color='secondary'
                                onChange={ (ev, value) => handlePitchChange(index, value) }
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundKey: id, soundEntryIndex: index, property: 'pitch', value }) }
                                disabled={ !editable }
                            />
                        </Stack>
                        <Stack>
                            <small>Weight</small>
                            <Slider
                                value={ soundEntry['weight'] ? soundEntry['weight'] : 1 }
                                size='small'
                                valueLabelDisplay='auto'
                                min={ 1 }
                                max={ 10 }
                                color='secondary'
                                disabled
                            />
                        </Stack>
                        <Stack direction='row' sx={ { justifyContent: 'space-between' } } >
                            <Tooltip title='If unchecked, this "name" is interpreted as a file.'>
                                <FormControlLabel
                                    control={ <Checkbox checked={ isEvent[index] } /> }
                                    label='Event'
                                    disabled={ !editable }
                                    onChange={ (ev, checked) => handleSoundTypeChange(index, checked) }
                                />
                            </Tooltip>
                            <div className={ `${classPrefix}-preview-sound` }>
                                <Tooltip title={ (errorWhenPlaySound) ? 'An error occurred...' : <>Play this sound.<br />The result may be different in game.</> } arrow>
                                    <IconButton onClick={ () => handlePlaySound(index) }>
                                        { (errorWhenPlaySound) ? <MusicOff color='error' /> : <MusicNoteOutlined /> }
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </Stack>
                    </List>
                ))}
            </AccordionDetails>
        </Accordion>
    );
};

SoundEntryEditor.propTypes = {
    sounds: PropTypes.array.isRequired,
    onItemDelete: PropTypes.func,
    onItemNameChange: PropTypes.func,
    onItemValueChange: PropTypes.func,
    onAccordionClick: PropTypes.func.isRequired,
    onPlaySound: PropTypes.func,
    id: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    isOpen: PropTypes.bool,
    errorWhenPlaySound: PropTypes.any,
};

export default SoundEntryEditor;
