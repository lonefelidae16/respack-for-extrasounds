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
 *      title: string,
 *      id: string,
 *      draggable: boolean,
 * }} props
 */
const SoundEntryVisualizer = (props) => {
    const { objects, onItemClick, title, id, draggable } = props;
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
                    <List
                        sx={ { pt: 0, overflow: 'hidden', overflowY: 'auto' } }
                        ref={ providedDroppable.innerRef }
                        { ...providedDroppable.droppableProps }
                    >
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
                                    entry={ key }
                                    sounds={ objects[key]['sounds'] }
                                    onAccordionClick={ handleAccordionClick }
                                    isOpen={ openedAccordion === key }
                                    { ...props }
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
    title: PropTypes.string,
    id: PropTypes.string.isRequired,
    draggable: PropTypes.bool,
};

export default SoundEntryVisualizer;
