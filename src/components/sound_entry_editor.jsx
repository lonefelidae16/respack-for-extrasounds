'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Checkbox, Divider, FormControlLabel, IconButton, List, Popper, Slider, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Delete, Edit, LibraryAdd, MusicNoteOutlined, MusicOff, RemoveCircle } from '@mui/icons-material';

import ListboxComponent from './listbox_component.jsx';

import { StateHandler } from '../util/globals.js';

const classNamePrefix = 'sound-entry-editor';

/**
 * @param {{
 *      sounds: array,
 *      entry: string,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      onAccordionClick: (value: string) => void,
 *      onSoundAddToEntry: (value: string) => void,
 *      onSoundRemoveFromEntry: (value: string, index: number) => void,
 *      checkEntryExists: (entryName: string) => boolean,
 *      editable: boolean,
 *      isOpen: boolean,
 * }} props
 */
const SoundEntryEditor = (props) => {
    const { t } = useTranslation();
    const { sounds, entry, onItemDelete, onItemNameChange, onItemValueChange, onAccordionClick,
        onSoundAddToEntry, onSoundRemoveFromEntry, checkEntryExists, editable, isOpen } = props;
    const [entryNameEditorShow, setEntryNameEditorShow] = useState(false);
    const [currentEntryName, setCurrentEntryName] = useState(entry);
    const [entryNameDuplicate, setEntryNameDuplicate] = useState(false);
    const [entryNameEmpty, setEntryNameEmpty] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [errorWhenPlaySound, setErrorWhenPlaySound] = useState(0);
    const [soundName, setSoundName] = useState(sounds.map(entry => ((typeof entry) === 'string') ? entry : entry['name']));
    const [volume, setVolume] = useState(sounds.map(entry => entry['volume'] ?? 1));
    const [pitch, setPitch] = useState(sounds.map(entry => entry['pitch'] ?? 1));
    const [isEvent, setEvent] = useState(sounds.map(entry => entry['type'] === 'event'));

    const isEntryNameValid = () => {
        return !entryNameDuplicate && !entryNameEmpty;
    };

    const handleListItemClick = (entryName) => {
        onAccordionClick(entryName);
    };

    const handleItemDelete = (entryName) => {
        if (onItemDelete) {
            onItemDelete(entryName);
        }
        onAccordionClick(false);
        setEntryNameEditorShow(false);
    };

    /**
     * @param {React.KeyboardEvent} ev
     */
    const handleEntryNameEditor = (ev) => {
        if (ev.key.match(/^enter$/i)) {
            handleItemNameChange(currentEntryName);
        }
        if (ev.key.match(/^escape$/i)) {
            handleItemNameChange(null);
        }
    };

    const handleEntryNameChange = (newValue) => {
        setCurrentEntryName(newValue);
        if (entry === newValue) {
            setEntryNameDuplicate(false);
        } else if (checkEntryExists) {
            setEntryNameDuplicate(checkEntryExists(newValue));
        }
        setEntryNameEmpty(newValue.length === 0);
    };

    const handleItemNameChange = (newName) => {
        if (onItemNameChange && newName !== null && isEntryNameValid()) {
            onItemNameChange(entry, newName);
        }
        setEntryNameEditorShow(false);
    };

    /**
     * @param {{
     *      soundEntry: string,
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
        setSoundName(current => {
            const newNames = [...current];
            newNames[index] = value;
            return newNames;
        });
        setEvent(current => {
            const newEvents = [...current];
            newEvents[index] = StateHandler.isEventSoundName(value);
            return newEvents;
        });
        handleValueChange({ soundEntry: entry, soundEntryIndex: index, property: 'name', value });
    };

    const handleVolumeChange = (index, value) => {
        setVolume(current => {
            const newVols = [...current];
            newVols[index] = value;
            return newVols;
        });
    };

    const handlePitchChange = (index, value) => {
        setPitch(current => {
            const newPitches = [...current];
            newPitches[index] = value;
            return newPitches;
        });
    };

    const handleSoundTypeChange = (index, checked) => {
        setEvent(current => {
            const newEvents = [...current];
            newEvents[index] = checked;
            return newEvents;
        });
        handleValueChange({ soundEntry: entry, soundEntryIndex: index, property: 'type', value: (checked ? 'event' : null) });
    };

    const handlePlaySound = (index) => {
        setPlaying(true);
        StateHandler.playSoundAsync(soundName[index], volume[index], pitch[index], isEvent[index])
            .catch(() => {
                handlePlaySoundError();
            }).finally(() => {
                setPlaying(false);
            });
    };

    const handlePlaySoundError = () => {
        if (errorWhenPlaySound) {
            clearTimeout(errorWhenPlaySound);
        }
        setErrorWhenPlaySound(setTimeout(() => setErrorWhenPlaySound(false), 5000));
    };

    const handleAddSound = () => {
        if (onSoundAddToEntry) {
            onSoundAddToEntry(entry);
        }
        setSoundName(current => {
            const newSounds = [...current, ''];
            return newSounds;
        });
        setVolume(current => {
            const newVols = [...current, 1];
            return newVols;
        });
        setPitch(current => {
            const newPitches = [...current, 1];
            return newPitches;
        });
        setEvent(current => {
            const newEvents = [...current, false];
            return newEvents;
        });
    };

    const handleRemoveSound = (index) => {
        if (onSoundRemoveFromEntry) {
            onSoundRemoveFromEntry(entry, index);
        }
    };

    return (
        <Accordion expanded={ isOpen }>
            <AccordionSummary onClick={ () => handleListItemClick(entry) }>
                <div className={ `${classNamePrefix}-accordion-wrapper` }>
                    <div hidden={ !editable } className={ `${classNamePrefix}-edit-entry` }>
                        <Tooltip title={ `${t('Edit Entry name:')} "${entry}"` } arrow>
                            <IconButton onClick={ (ev) => {
                                setEntryNameEditorShow(true);
                                setTimeout(() => document.getElementById(`${classNamePrefix}-${entry}`).focus(), 66);
                                ev.stopPropagation();
                            } }>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div className={ `${classNamePrefix}-entry-name` }>
                        <Typography hidden={ entryNameEditorShow }>{entry}</Typography>
                        <div hidden={ !entryNameEditorShow } onClick={ (ev) => ev.stopPropagation() }>
                            <Autocomplete
                                options={ StateHandler.getExtraSoundsEntryList() }
                                value={ currentEntryName }
                                id={ `${classNamePrefix}-${entry}` }
                                isOptionEqualToValue={ (option, value) => option === value }
                                disableListWrap
                                PopperComponent={ Popper }
                                ListboxComponent={ ListboxComponent }
                                onChange={ (ev, newValue) => handleEntryNameChange(newValue) }
                                onInputChange={ (ev, newValue) => handleEntryNameChange(newValue) }
                                onBlur={ () => handleItemNameChange(currentEntryName) }
                                renderInput={ params =>
                                    <TextField
                                        { ...params }
                                        label={ t('Entry') }
                                        margin='dense'
                                        variant='standard'
                                        error={ !isEntryNameValid() }
                                        helperText={ (entryNameDuplicate) ? t('This name is already exists.') : '' }
                                        onKeyDown={ handleEntryNameEditor }
                                        fullWidth
                                    />
                                }
                                renderOption={ (props, option, state) => [props, option, state.index] }
                                renderGroup={ (params) => params }
                            />
                        </div>
                    </div>
                    <div hidden={ !editable } className={ `${classNamePrefix}-remove-entry` }>
                        <Tooltip title={ t('Remove this Entry.') } arrow>
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
                        <Stack direction='row' sx={ { alignItems: 'center' } }>
                            <Autocomplete
                                size='small'
                                value={ soundName[index] }
                                options={ StateHandler.getSoundNameList() }
                                fullWidth
                                isOptionEqualToValue={ (option, value) => option === value }
                                disableListWrap
                                PopperComponent={ Popper }
                                ListboxComponent={ ListboxComponent }
                                sx={ { marginBottom: '1em' } }
                                disabled={ !editable }
                                onChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                                onInputChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                                renderInput={ params => <TextField { ...params } label={ t('Sound Name') } variant='standard' /> }
                                renderOption={ (props, option, state) => [props, option, state.index] }
                                renderGroup={ (params) => params }
                            />
                            <Box>
                                <Tooltip title={ t('Remove this sound.') } arrow>
                                    <IconButton onClick={ () => handleRemoveSound(index) }>
                                        <RemoveCircle color='error' />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Stack>
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
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundEntry: entry, soundEntryIndex: index, property: 'volume', value }) }
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
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundEntry: entry, soundEntryIndex: index, property: 'pitch', value }) }
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
                            <Box className={ `${classNamePrefix}-preview-sound` }>
                                <Tooltip title={ (errorWhenPlaySound) ? t('An error occurred...') : <>{t('Play this sound.')}<br />{t('The result may be different in game.')}</> } arrow>
                                    <Box component='span' sx={ { display: 'inline-block' } }>
                                        <IconButton
                                            disabled={ playing }
                                            onClick={ () => handlePlaySound(index) }
                                        >
                                            { (errorWhenPlaySound) ? <MusicOff color='error' /> : <MusicNoteOutlined /> }
                                        </IconButton>
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Stack>
                        <Divider />
                    </List>
                ))}
                <Box sx={ { margin: '0 auto', width: 'fit-content' } }>
                    <Tooltip title={ t('Click to add sound.') } arrow>
                        <IconButton onClick={ handleAddSound }>
                            <LibraryAdd />
                        </IconButton>
                    </Tooltip>
                </Box>
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
    onSoundAddToEntry: PropTypes.func,
    onSoundRemoveFromEntry: PropTypes.func,
    checkEntryExists: PropTypes.func,
    entry: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    isOpen: PropTypes.bool,
};

export default SoundEntryEditor;
