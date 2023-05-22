'use strict';

/** @typedef {import('../@types/sounds_json.js').SoundsJson} SoundsJson */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Box, IconButton, List, ListItemButton, ListItemText, TextField, Tooltip } from '@mui/material';
import { AddBox, Clear } from '@mui/icons-material';

import SoundEntryEditor from './sound_entry_editor.jsx';

import FileJson from '../icons/file_json.jsx';
import InputDialog from './input_dialog.jsx';

import Arrays from '../util/arrays.js';

const classNamePrefix = 'sound-entry-visualizer';
const jsonDelimiter = '.';

/**
 * @param {{
 *      objects: SoundsJson,
 *      onItemClick: (value: string) => void,
 *      onEntryAdd: (value: string) => void,
 *      checkEntryExists: (value: string) => boolean,
 *      title: string,
 *      id: string,
 *      draggable: boolean,
 *      editable: boolean,
 *      limitCount: number,
 *      searchFilter: string,
 * }} props
 */
const SoundEntryVisualizer = (props) => {
    const { t } = useTranslation();
    const { objects, onItemClick, onEntryAdd, checkEntryExists, searchFilter: requestedFilter,
        title, id, draggable, editable, limitCount } = props;
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [openedAccordion, setOpenedAccordion] = useState(false);
    const [isOenedNewEntryDialog, setOpenedNewEntryDialog] = useState(false);
    const [isNewEntryInvalid, setNewEntryInvalid] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');

    useEffect(() => {
        if (requestedFilter) {
            setSearchFilter(requestedFilter);
            setOpenedAccordion(requestedFilter);
        }
    }, [requestedFilter]);

    const handleListItemClick = (entryName) => {
        onItemClick(entryName);
    };

    const handleSearchFilterSuggest = (filter) => {
        if (searchFilter === filter) {
            filter += jsonDelimiter;
        }
        setSearchFilter(filter);
    };

    /**
     * Attempts to open editable accordion by specified name.
     *
     * @param {string} entryName Target name.
     */
    const handleAccordionClick = (entryName) => {
        if (openedAccordion === entryName) {
            setOpenedAccordion(false);
        } else {
            setOpenedAccordion(entryName);
        }
    };

    /**
     * Handles search field and sets the filter.
     *
     * @param {React.ChangeEvent} ev The event.
     */
    const handleSearchEntry = (ev) => {
        setSearchFilter(ev.target.value);
    };

    /**
     * Opens editable dialog that names new entry.
     */
    const handleDialogOpen = () => {
        if (onEntryAdd) {
            setOpenedNewEntryDialog(true);
        }
    };

    /**
     * Attempts to add a new entry.
     *
     * @param {string} entryName The new name.
     */
    const handleAddEntry = (entryName) => {
        setOpenedNewEntryDialog(false);
        if (entryName && onEntryAdd) {
            onEntryAdd(entryName);
        }
    };

    /**
     * Attempts to validate a new entry.
     *
     * @param {React.ChangeEvent} ev
     */
    const handleNewEntryName = (ev) => {
        const newValue = ev.target.value;
        setNewEntryInvalid(newValue.length === 0 || checkEntryExists(newValue));
    };

    /**
     * Helper method rendering json entries.
     *
     * @returns {React.JSX.Element[]} The result.
     */
    const objectRenderer = () => {
        const targets = Object.keys(objects).filter(value => (searchFilter) ? value.startsWith(searchFilter) : value);
        const inputSeq = searchFilter.split(jsonDelimiter).length - 1;
        const elements = Arrays.sortedUnique(
            targets.filter(key => key.split(jsonDelimiter)[inputSeq])
                .map(key => key.split(jsonDelimiter).slice(0, inputSeq + 1).join(jsonDelimiter))
        );
        const limit = limitCount ?? 20;

        if (targets.length > limit) {
            // Exceeded the limit.
            const limited = elements.slice(0, limit).map(elem => (
                <ListItemButton
                    sx={ { color: 'khaki' } }
                    key={ elem }
                    onClick={ () => handleSearchFilterSuggest(targets.includes(elem) ? elem : `${elem}${jsonDelimiter}`) }
                >
                    {elem}...
                </ListItemButton>
            ));
            limited.push(<ListItemButton key='item-count' disabled>{t('Found %d items').replace('%d', targets.length)}</ListItemButton>);
            return limited;
        }

        return targets.map((key, index) =>
            draggable ? (
                <Draggable key={ key } draggableId={ key } index={ index }>
                    {providedDraggable => (
                        <ListItemButton
                            key={ key }
                            onClick={ () => handleListItemClick(key) }
                            ref={ providedDraggable.innerRef }
                            { ...providedDraggable.draggableProps }
                            { ...providedDraggable.dragHandleProps }
                        >
                            <ListItemText primary={ key } />
                        </ListItemButton>
                    )}
                </Draggable>
            ) : (
                <SoundEntryEditor
                    { ...props }
                    key={ key }
                    entryName={ key }
                    sounds={ objects[key]['sounds'] }
                    onAccordionClick={ handleAccordionClick }
                    isOpen={ openedAccordion === key }
                />
            ));
    };

    return (
        <div>
            <div id={ `${classNamePrefix}-${id}-title` } className={ `minecraft ${classNamePrefix}-title ${classNamePrefix}-${id}-title` }><FileJson width='2.25rem' height='2.25rem' /> {title}</div>
            <div className={ `${classNamePrefix}-control-box` }>
                <Box sx={ { width: '100%' } }>
                    <TextField
                        className={ `${classNamePrefix}-search-bar` }
                        label={ t('Search Entries') }
                        value={ searchFilter }
                        variant='standard'
                        margin='dense'
                        size='small'
                        onChange={ handleSearchEntry }
                    />
                    <IconButton
                        onClick={ () => setSearchFilter('') }
                        sx={ { position: 'absolute', transform: 'translate(-1.25em, 0.5em)', visibility: (!searchFilter) ? 'hidden' : 'visible' } }
                    >
                        <Clear />
                    </IconButton>
                </Box>
                <div className={ `${classNamePrefix}-control-editable` } hidden={ !editable }>
                    <Tooltip title={ t('Click to add a new entry.') } arrow>
                        <IconButton onClick={ handleDialogOpen }>
                            <AddBox />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
            <Droppable droppableId={ id }>
                {providedDroppable => (
                    <List
                        sx={ { height: '100%', pt: 0, overflow: 'hidden', overflowY: 'auto' } }
                        ref={ providedDroppable.innerRef }
                        { ...providedDroppable.droppableProps }
                    >
                        { objectRenderer() }
                        { providedDroppable.placeholder }
                    </List>
                )}
            </Droppable>
            { editable ? (
                <InputDialog
                    isOpen={ isOenedNewEntryDialog }
                    title={ t('Add New Entry') }
                    label={ t('Entry Name') }
                    variant='standard'
                    onChange={ handleNewEntryName }
                    isError={ isNewEntryInvalid }
                    onClose={ handleAddEntry }
                    required
                />
            ) : ''}
        </div>
    );
};

SoundEntryVisualizer.propTypes = {
    objects: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onEntryAdd: PropTypes.func,
    checkEntryExists: PropTypes.func,
    title: PropTypes.string,
    id: PropTypes.string.isRequired,
    draggable: PropTypes.bool,
    editable: PropTypes.bool,
    limitCount: PropTypes.number,
    searchFilter: PropTypes.string,
};

export default SoundEntryVisualizer;
