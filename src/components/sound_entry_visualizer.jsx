'use strict';

import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { List, ListItemButton, ListItemText } from '@mui/material';
import PropTypes from 'prop-types';

import SoundEntryEditor from './sound_entry_editor.jsx';

import FileJson from '../icons/file_json.jsx';

/**
 * @param {{
 *      objects: object,
 *      onItemClick: (value: string) => void,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      onPlaySound: (entryName: string, volume: number, pitch: number, isEvent: boolean) => Promise<void>,
 *      checkEntryExists: (entryName: string) => boolean,
 *      title: string,
 *      id: string,
 *      draggable: boolean,
 *      editable: boolean,
 * }} props
 */
const SoundEntryVisualizer = (props) => {
    const { objects, onItemClick, onItemDelete, onItemNameChange, onItemValueChange, onPlaySound, checkEntryExists,
        title, id, draggable, editable, errorWhenPlaySound } = props;
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [openedAccordion, setOpenedAccordion] = useState(false);

    const handleListItemClick = (entryName) => {
        onItemClick(entryName);
    };

    const handleAccordionClick = (entryName) => {
        if (openedAccordion === entryName) {
            setOpenedAccordion(false);
        } else {
            setOpenedAccordion(entryName);
        }
    };

    return (
        <div>
            <div id={ `sound-entry-visualizer-${id}-title` } className={ `minecraft sound-entry-visualizer-title sound-entry-visualizer-${id}-title` }><FileJson width='2.25rem' height='2.25rem' /> {title}</div>
            <Droppable droppableId={ id }>
                {providedDroppable => (
                    <List sx={ { pt: 0, overflow: 'hidden', overflowY: 'auto' } } ref={ providedDroppable.innerRef } { ...providedDroppable.droppableProps }>
                        {Object.keys(objects).map((key, index) =>
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
                                    key={ key }
                                    id={ key }
                                    sounds={ objects[key]['sounds'] }
                                    onItemDelete={ onItemDelete }
                                    onItemNameChange={ onItemNameChange }
                                    onItemValueChange={ onItemValueChange }
                                    onAccordionClick={ handleAccordionClick }
                                    onPlaySound={ onPlaySound }
                                    checkEntryExists={ checkEntryExists }
                                    editable={ editable }
                                    isOpen={ openedAccordion === key }
                                    errorWhenPlaySound={ errorWhenPlaySound }
                                />
                            ))}
                        { providedDroppable.placeholder }
                    </List>
                )}
            </Droppable>
        </div>
    );
};

SoundEntryVisualizer.propTypes = {
    objects: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onItemDelete: PropTypes.func,
    onItemNameChange: PropTypes.func,
    onItemValueChange: PropTypes.func,
    onPlaySound: PropTypes.func,
    checkEntryExists: PropTypes.func,
    title: PropTypes.string,
    id: PropTypes.string.isRequired,
    draggable: PropTypes.bool,
    editable: PropTypes.bool,
    errorWhenPlaySound: PropTypes.any,
};

export default SoundEntryVisualizer;
