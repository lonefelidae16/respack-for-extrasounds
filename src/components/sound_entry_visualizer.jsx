'use strict';

import React, { useState } from 'react';
import { List, ListItemButton, ListItemText } from '@mui/material';
import PropTypes from 'prop-types';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import SoundEntryEditor from './sound_entry_editor.jsx';

/**
 * @param {{
 *      objects: object,
 *      onItemClick: (value: string) => void,
 *      onItemDelete: (value: string) => void,
 *      onItemNameChange: (before: string, after: string) => void,
 *      onItemValueChange: (obj: {soundKey: string, soundEntryIndex: number, property: string, value: any}) => void,
 *      title: string,
 *      id: string,
 *      draggable: boolean,
 *      editable: boolean,
 * }} props
 */
const SoundEntryVisualizer = (props) => {
    const { objects, onItemClick, onItemDelete, onItemNameChange, onItemValueChange, title, id, draggable, editable } = props;
    /** @type {[string | false, React.Dispatch<string | false>]} */
    const [openedAccordion, setOpenedAccordion] = useState(false);

    const handleListItemClick = (entryName) => {
        onItemClick(entryName);
    };

    return (
        <div>
            <div id={ `sound-entry-visualizer-${id}-title` } className={ `sound-entry-visualizer-title sound-entry-visualizer-${id}-title` }><span className='c-fab c-fab-file-json' style={ { width: '2.25rem', height: '2.25rem' } } /> {title}</div>
            <Droppable droppableId={ id }>
                {providedDroppable => (
                    <List sx={ { pt: 0, minHeight: '50vh', maxHeight: '85vh', overflow: 'hidden', overflowY: 'auto' } } ref={ providedDroppable.innerRef } { ...providedDroppable.droppableProps }>
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
                                    onAccordionClick={ (entryName) => setOpenedAccordion(entryName) }
                                    editable={ editable }
                                    isOpen={ openedAccordion === key }
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
    title: PropTypes.string,
    id: PropTypes.string.isRequired,
    draggable: PropTypes.bool,
    editable: PropTypes.bool,
};

export default SoundEntryVisualizer;
