'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControlLabel, FormGroup, IconButton, List, Slider, Stack, TextField, Typography } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

/**
 * @param {{
 *      sounds: array,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      onAccordionClick: (value: string) => void,
 *      id: string,
 *      editable: boolean,
 *      isOpen: boolean,
 * }} props
 */
const SoundEntryEditor = (props) => {
    const { sounds, id, onItemDelete, onItemNameChange, onItemValueChange, onAccordionClick, editable, isOpen } = props;
    const [entryNameEditorShow, setEntryNameEditorShow] = useState(false);
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [editingEntryName, setEditingEntryName] = useState(false);
    const [volume, setVolume] = useState(sounds.map(entry => entry['volume']));
    const [pitch, setPitch] = useState(sounds.map(entry => entry['pitch']));
    const [isEvent, setEvent] = useState(sounds.map(entry => entry['type'] === 'event'));

    const handleListItemClick = (entryName) => {
        if (onAccordionClick) {
            onAccordionClick(entryName);
        }
    };

    const handleItemDelete = (entryName) => {
        if (onItemDelete) {
            onItemDelete(entryName);
        }
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

    return (
        <Accordion expanded={ isOpen }>
            <AccordionSummary onClick={ () => handleListItemClick(id) }>
                <div style={ { display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' } }>
                    <div hidden={ !editable }>
                        <IconButton onClick={ () => handleNameEdit(id) }>
                            <Edit />
                        </IconButton>
                    </div>
                    <div style={ { flexGrow: 1 } } >
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
                    <div hidden={ !editable }>
                        <IconButton onClick={ () => handleItemDelete(id) }>
                            <Delete color='error' />
                        </IconButton>
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
                            value={ soundEntry['name'] }
                            fullWidth
                            sx={ { marginBottom: '1em' } }
                            disabled={ !editable }
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
                                defaultValue={ soundEntry['pitch'] ? soundEntry['pitch'] : 1 }
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
                        <FormGroup>
                            <FormControlLabel
                                control={ <Checkbox checked={ isEvent[index] } /> }
                                label='Event'
                                disabled={ !editable }
                                onChange={ (ev, checked) => handleSoundTypeChange(index, checked) }
                            />
                        </FormGroup>
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
    onAccordionClick: PropTypes.func,
    id: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    isOpen: PropTypes.bool,
};

export default SoundEntryEditor;
