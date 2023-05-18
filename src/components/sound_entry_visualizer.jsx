'use strict';

import React, { useState } from 'react';
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

/**
 * @param {{
 *      objects: object,
 *      onItemClick: (value: string) => void,
 *      onEntryAdd: (value: string) => void,
 *      checkEntryExists: (value: string) => boolean,
 *      title: string,
 *      id: string,
 *      draggable: boolean,
 *      editable: boolean,
 * }} props
 */
const SoundEntryVisualizer = (props) => {
    const { t } = useTranslation();
    const { objects, onItemClick, onEntryAdd, checkEntryExists, title, id, draggable, editable } = props;
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [openedAccordion, setOpenedAccordion] = useState(false);
    const [isOenedNewEntryDialog, setOpenedNewEntryDialog] = useState(false);
    const [isNewEntryInvalid, setNewEntryInvalid] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');

    const handleListItemClick = (entryName) => {
        onItemClick(entryName);
    };

    const handleSearchFilterSuggest = (filter) => {
        setSearchFilter(filter);
    };

    const handleAccordionClick = (entryName) => {
        if (openedAccordion === entryName) {
            setOpenedAccordion(false);
        } else {
            setOpenedAccordion(entryName);
        }
    };

    /**
     * @param {React.ChangeEvent} ev
     */
    const handleSearchEntry = (ev) => {
        setSearchFilter(ev.target.value);
    };

    const handleDialogOpen = () => {
        if (onEntryAdd) {
            setOpenedNewEntryDialog(true);
        }
    };

    const handleAddEntry = (entryName) => {
        setOpenedNewEntryDialog(false);
        if (entryName && onEntryAdd) {
            onEntryAdd(entryName);
        }
    };

    const objectRenderer = () => {
        const targets = Object.keys(objects).filter(value => (searchFilter) ? value.startsWith(searchFilter) : value);
        const inputSeq = searchFilter.split('.').length - 1;
        const elements = Arrays.sortedUnique(
            targets.filter(key => key.split('.')[inputSeq])
                .map(key => key.split('.').slice(0, inputSeq + 1).join('.'))
        );

        if (targets.length > 20) {
            /*
            action...
            hotbar...
            item...
            item.pickup...
            */
            return elements.map(elem => (
                <ListItemButton sx={ { color: 'khaki' } } key={ elem } onClick={ () => handleSearchFilterSuggest(targets.includes(elem) ? elem : `${elem}.`) }>{elem}...</ListItemButton>
            ));
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
                    entry={ key }
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
                    onChange={ (ev) => setNewEntryInvalid(ev.target.value.length === 0 || checkEntryExists(ev.target.value)) }
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
};

export default SoundEntryVisualizer;
