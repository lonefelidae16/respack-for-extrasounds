'use strict';

/** @typedef {import('../@types/sounds_json.js').SoundEntry} SoundEntry */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Checkbox, Divider, FormControlLabel, IconButton, List, Popper, Slider, Stack, TextField, Tooltip } from '@mui/material';
import { Delete, Edit, Error, LibraryAdd, MusicNoteOutlined, MusicOff, RemoveCircle } from '@mui/icons-material';

import ListboxComponent from './listbox_component.jsx';

import { StateHandler } from '../util/globals.js';
import Arrays from '../util/arrays.js';

const classNamePrefix = 'sound-entry-editor';

/**
 * @param {{
 *      sounds: SoundEntry[] | string[],
 *      entryName: string,
 *      onEntryDelete: (value: string) => void,
 *      onEntryNameChange: (before: string, after: string) => void,
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
    const { sounds, entryName, onEntryDelete, onEntryNameChange, onItemValueChange, onAccordionClick,
        onSoundAddToEntry, onSoundRemoveFromEntry, checkEntryExists, editable, isOpen } = props;
    const [entryNameEditorShow, setEntryNameEditorShow] = useState(false);
    const [currentEntryName, setCurrentEntryName] = useState(entryName);
    const [entryNameDuplicate, setEntryNameDuplicate] = useState(false);
    const [entryNameEmpty, setEntryNameEmpty] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [errorWhenPlaySound, setErrorWhenPlaySound] = useState(0);
    const [soundName, setSoundName] = useState(sounds.map(entry => ((typeof entry) === 'string') ? entry : entry['name']));
    const [volume, setVolume] = useState(sounds.map(entry => entry['volume'] ?? 1));
    const [pitch, setPitch] = useState(sounds.map(entry => entry['pitch'] ?? 1));
    const [isEvent, setEvent] = useState(sounds.map(entry => entry['type'] === 'event'));
    const [isInfiniteLoopSound, setInfiniteLoopSound] = useState([...Array(sounds.length)].map(() => false));

    const isEntryNameValid = () => {
        return !entryNameDuplicate && !entryNameEmpty;
    };

    const handleListItemClick = (entryName) => {
        onAccordionClick(entryName);
    };

    const handleEntryDelete = (entryName) => {
        if (onEntryDelete) {
            onEntryDelete(entryName);
        }
        onAccordionClick(false);
        setEntryNameEditorShow(false);
    };

    /**
     * @param {React.KeyboardEvent} ev
     */
    const handleEntryNameEditor = (ev) => {
        if (ev.key.match(/^enter$/i)) {
            handleEntryNameChange(currentEntryName);
        }
        if (ev.key.match(/^escape$/i)) {
            handleEntryNameChange(null);
        }
    };

    const checkEntryName = (newValue) => {
        setCurrentEntryName(newValue);
        if (entryName === newValue) {
            setEntryNameDuplicate(false);
        } else if (checkEntryExists) {
            setEntryNameDuplicate(checkEntryExists(newValue));
        }
        setEntryNameEmpty(newValue.length === 0);
    };

    const handleEntryNameChange = (newName) => {
        if (onEntryNameChange && newName !== null && isEntryNameValid()) {
            onEntryNameChange(entryName, newName);
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

    /**
     *
     * @param {number} index
     * @param {string} value
     */
    const handleSoundNameChange = (index, value) => {
        value = (value) ?? '';
        const isEventSound = StateHandler.isEventSoundName(value);
        setSoundName(current => {
            const newNames = [...current];
            newNames[index] = value;
            return newNames;
        });
        setEvent(current => {
            const newEvents = [...current];
            newEvents[index] = isEventSound;
            return newEvents;
        });
        if (value.startsWith('extrasounds:') && isEventSound) {
            const [, path] = value.split(':');
            const isInfiniteDetected = (path === entryName);
            setInfiniteLoopSound(current => {
                const newValue = [...current];
                newValue[index] = isInfiniteDetected;
                return newValue;
            });
            if (isInfiniteDetected) {
                return;
            }
        }
        handleValueChange({ soundEntry: entryName, soundEntryIndex: index, property: 'name', value });
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
        handleValueChange({ soundEntry: entryName, soundEntryIndex: index, property: 'type', value: (checked ? 'event' : null) });
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
            onSoundAddToEntry(entryName);
        }
        setSoundName(current => [...current, '']);
        setVolume(current => [...current, 1]);
        setPitch(current => [...current, 1]);
        setEvent(current => [...current, false]);
        setInfiniteLoopSound(current => [...current, false]);
        setTimeout(() => document.getElementById(`${classNamePrefix}-${entryName}-sound${sounds.length - 1}-name`).focus(), 66);
    };

    const handleRemoveSound = (index) => {
        if (onSoundRemoveFromEntry) {
            onSoundRemoveFromEntry(entryName, index);
        }
        setSoundName(current => {
            delete current[index];
            return Arrays.filterNonNull(current);
        });
        setVolume(current => {
            delete current[index];
            return Arrays.filterNonNull(current);
        });
        setPitch(current => {
            delete current[index];
            return Arrays.filterNonNull(current);
        });
        setEvent(current => {
            delete current[index];
            return Arrays.filterNonNull(current);
        });
        setInfiniteLoopSound(current => {
            delete current[index];
            return Arrays.filterNonNull(current);
        });
    };

    return (
        <Accordion expanded={ isOpen }>
            <AccordionSummary onClick={ () => handleListItemClick(entryName) }>
                <div className={ `${classNamePrefix}-accordion-wrapper` }>
                    <div hidden={ !editable } className={ `${classNamePrefix}-edit-entry` }>
                        <Tooltip title={ `${t('Edit Entry name:')} "${entryName}"` } arrow>
                            <IconButton onClick={ (ev) => {
                                setEntryNameEditorShow(true);
                                setTimeout(() => document.getElementById(`${classNamePrefix}-${entryName}`).focus(), 66);
                                ev.stopPropagation();
                            } }>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div className={ `${classNamePrefix}-entry-name` }>
                        <div hidden={ entryNameEditorShow }>
                            {entryName}
                            <Box component='small' hidden={ soundName.every(name => name) } className='error-msg'><Error sx={ { width: '0.75em', height: '0.75em', marginLeft: '1em' } } /> {t('This Entry contains some empty Sound Name.')}</Box>
                        </div>
                        <div hidden={ !entryNameEditorShow } onClick={ (ev) => ev.stopPropagation() }>
                            <Autocomplete
                                options={ StateHandler.getExtraSoundsEntryList() }
                                value={ currentEntryName }
                                id={ `${classNamePrefix}-${entryName}` }
                                isOptionEqualToValue={ (option, value) => option === value }
                                disableListWrap
                                PopperComponent={ Popper }
                                ListboxComponent={ ListboxComponent }
                                onChange={ (ev, newValue) => checkEntryName(newValue) }
                                onInputChange={ (ev, newValue) => checkEntryName(newValue) }
                                onBlur={ () => handleEntryNameChange(currentEntryName) }
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
                                handleEntryDelete(entryName);
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
                    <List key={ `${entryName}-sound${index}` }>
                        <Stack direction='row' sx={ { alignItems: 'center' } }>
                            <Autocomplete
                                size='small'
                                value={ soundName[index] }
                                options={ StateHandler.getSoundNameList() }
                                fullWidth
                                id={ `${classNamePrefix}-${entryName}-sound${index}-name` }
                                isOptionEqualToValue={ (option, value) => option === value }
                                disableListWrap
                                PopperComponent={ Popper }
                                ListboxComponent={ ListboxComponent }
                                sx={ { marginBottom: '1em' } }
                                disabled={ !editable }
                                onChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                                onInputChange={ (ev, newValue) => handleSoundNameChange(index, newValue) }
                                renderInput={ params =>
                                    <TextField
                                        { ...params }
                                        label={ t('Sound Name') }
                                        variant='standard'
                                        error={ isInfiniteLoopSound[index] || !soundName[index] }
                                        helperText={ (isInfiniteLoopSound[index]) ? t('Sound Name cannot be the same its Entry Name.') : '' }
                                    />
                                }
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
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundEntry: entryName, soundEntryIndex: index, property: 'volume', value }) }
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
                                onChangeCommitted={ (ev, value) => handleValueChange({ soundEntry: entryName, soundEntryIndex: index, property: 'pitch', value }) }
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
    onEntryDelete: PropTypes.func,
    onEntryNameChange: PropTypes.func,
    onItemValueChange: PropTypes.func,
    onAccordionClick: PropTypes.func.isRequired,
    onSoundAddToEntry: PropTypes.func,
    onSoundRemoveFromEntry: PropTypes.func,
    checkEntryExists: PropTypes.func,
    entryName: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    isOpen: PropTypes.bool,
};

export default SoundEntryEditor;
