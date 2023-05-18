'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Checkbox, FormControlLabel, IconButton, List, Slider, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Delete, Edit, MusicNoteOutlined, MusicOff } from '@mui/icons-material';

const classNamePrefix = 'sound-entry-editor';

/**
 * @param {{
 *      sounds: array,
 *      entry: string,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      onPlaySound: (entryName: string, volume: number, pitch: number, isEvent: boolean) => Promise<void>,
 *      onAccordionClick: (value: string) => void,
 *      checkEntryExists: (entryName: string) => boolean,
 *      editable: boolean,
 *      isOpen: boolean,
 *      errorWhenPlaySound: boolean,
 *      allSoundNameList: string[],
 *      extraSoundsEntryList: string[],
 * }} props
 */
const SoundEntryEditor = (props) => {
    const { t } = useTranslation();
    const { sounds, entry, onItemDelete, onItemNameChange, onItemValueChange, onAccordionClick, onPlaySound,
        checkEntryExists, editable, isOpen, errorWhenPlaySound, allSoundNameList, extraSoundsEntryList } = props;
    const [entryNameEditorShow, setEntryNameEditorShow] = useState(false);
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [editingEntryName, setEditingEntryName] = useState(false);
    const [entryNameDuplicate, setEntryNameDuplicate] = useState(false);
    const [entryNameEmpty, setEntryNameEmpty] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [soundName, setSoundName] = useState(sounds.map(entry => ((typeof entry) === 'string') ? entry : entry['name']));
    const [volume, setVolume] = useState(sounds.map(entry => entry['volume'] ?? 1));
    const [pitch, setPitch] = useState(sounds.map(entry => entry['pitch'] ?? 1));
    const [isEvent, setEvent] = useState(sounds.map(entry => entry['type'] === 'event'));

    const isEntryNameValid = () => {
        return entryNameDuplicate || entryNameEmpty;
    };

    const isEntryNameEditing = () => {
        return entryNameEditorShow && editingEntryName === entry;
    };

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
        setTimeout(() => document.getElementById(`${classNamePrefix}-${currentName}`).focus(), 66);
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

    /**
     * @param {React.ChangeEvent} ev
     */
    const checkValidEntryName = (ev) => {
        const value = ev.target.value;
        if (entry === value) {
            setEntryNameDuplicate(false);
        } else if (checkEntryExists) {
            setEntryNameDuplicate(checkEntryExists(value));
        }
        setEntryNameEmpty(value.length === 0);
    };

    const handleItemNameChange = (newName) => {
        if (onItemNameChange && newName !== null && isEntryNameValid()) {
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
        handleValueChange({ soundKey: entry, soundEntryIndex: index, property: 'name', value });
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
        handleValueChange({ soundKey: entry, soundEntryIndex: index, property: 'type', value: (checked ? 'event' : null) });
    };

    const handlePlaySound = (index) => {
        if (onPlaySound) {
            setPlaying(true);
            onPlaySound(soundName[index], volume[index], pitch[index], isEvent[index]).finally(() => {
                setPlaying(false);
            });
        }
    };

    return (
        <Accordion expanded={ isOpen }>
            <AccordionSummary onClick={ () => handleListItemClick(entry) }>
                <div className={ `${classNamePrefix}-accordion-wrapper` }>
                    <div hidden={ !editable } className={ `${classNamePrefix}-edit-entry` }>
                        <Tooltip title={ `${t('Edit the Entry name:')} "${entry}"` } arrow>
                            <IconButton onClick={ (ev) => {
                                handleNameEdit(entry);
                                ev.stopPropagation();
                            } }>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div className={ `${classNamePrefix}-entry-name` }>
                        <Typography hidden={ isEntryNameEditing() }>{entry}</Typography>
                        <div hidden={ !isEntryNameEditing() }>
                            {/* TODO: Autocompletize */}
                            <TextField
                                label={ t('Entry') }
                                defaultValue={ entry }
                                margin='dense'
                                id={ `${classNamePrefix}-${entry}` }
                                variant='standard'
                                error={ isEntryNameValid() }
                                helperText={ (entryNameDuplicate) ? t('This name is already exists.') : '' }
                                onKeyDown={ handleEntryNameEditor }
                                onChange={ checkValidEntryName }
                                onBlur={ (ev) => handleItemNameChange(ev.target.value) }
                                onClick={ (ev) => ev.stopPropagation() }
                                fullWidth
                            />
                        </div>
                    </div>
                    <div hidden={ !editable } className={ `${classNamePrefix}-remove-entry` }>
                        <Tooltip title={ t('Remove this Entry') } arrow>
                            <IconButton onClick={ (ev) => {
                                handleItemDelete(entry);
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
                    <List key={ `${entry}-sound${index}` }>
                        <Autocomplete
                            size='small'
                            value={ soundName[index] }
                            options={ allSoundNameList }
                            fullWidth
                            sx={ { marginBottom: '1em' } }
                            disabled={ !editable }
                            onChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                            onInputChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                            renderInput={ params => <TextField { ...params } label={ t('Sound Name') } /> }
                        />
                        <Stack>
                            <small>{t('Volume')}</small>
                            <Slider
                                value={ volume[index] }
                                size='small'
                                valueLabelDisplay='auto'
                                step={ 0.01 }
                                min={ 0 }
                                max={ 1 }
                                marks={ [
                                    { value: 0.5, label: '0.5' },
                                    { value: 1.0, label: '1.0' },
                                ] }
                                onChange={ (ev, value) => handleVolumeChange(index, value) }
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundKey: entry, soundEntryIndex: index, property: 'volume', value }) }
                                disabled={ !editable }
                            />
                        </Stack>
                        <Stack>
                            <small>{t('Pitch')}</small>
                            <Slider
                                value={ pitch[index] }
                                size='small'
                                valueLabelDisplay='auto'
                                step={ 0.01 }
                                min={ 0.1 }
                                max={ 2 }
                                marks={ [
                                    { value: 1.0, label: '1.0' },
                                    { value: 2.0, label: '2.0' },
                                ] }
                                color='secondary'
                                onChange={ (ev, value) => handlePitchChange(index, value) }
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundKey: entry, soundEntryIndex: index, property: 'pitch', value }) }
                                disabled={ !editable }
                            />
                        </Stack>
                        <Stack>
                            <small>{t('Weight')}</small>
                            <Slider
                                value={ soundEntry['weight'] ?? 1 }
                                size='small'
                                valueLabelDisplay='auto'
                                min={ 1 }
                                max={ 10 }
                                color='secondary'
                                disabled
                            />
                        </Stack>
                        <Stack direction='row' sx={ { justifyContent: 'space-between' } } >
                            <Tooltip title={ t('If unchecked, this "Sound Name" is interpreted as a file.') } arrow>
                                <FormControlLabel
                                    control={ <Checkbox checked={ isEvent[index] } /> }
                                    label={ t('Event') }
                                    disabled={ !editable }
                                    onChange={ (ev, checked) => handleSoundTypeChange(index, checked) }
                                />
                            </Tooltip>
                            <div className={ `${classNamePrefix}-preview-sound` }>
                                <Tooltip title={ (errorWhenPlaySound) ? t('An error occurred...') : <>{t('Play this sound.')}<br />{t('The result may be different in game.')}</> } arrow>
                                    <Box component='span'>
                                        <IconButton
                                            disabled={ playing }
                                            onClick={ () => handlePlaySound(index) }
                                        >
                                            { (errorWhenPlaySound) ? <MusicOff color='error' /> : <MusicNoteOutlined /> }
                                        </IconButton>
                                    </Box>
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
    checkEntryExists: PropTypes.func,
    entry: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    isOpen: PropTypes.bool,
    errorWhenPlaySound: PropTypes.any,
    allSoundNameList: PropTypes.array,
    extraSoundsEntryList: PropTypes.array,
};

export default SoundEntryEditor;
