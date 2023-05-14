'use strict';

import React, { useState } from 'react';
import { Button, Checkbox, Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * @param {{
 *      title: string,
 *      values: string[],
 *      onClose: (result: string | null) => void,
 *      selectedValue: string,
 *      isOpen: boolean,
 *      cancelString: string,
 *      okString: string,
 * }} props
 */
const SimpleDialog = (props) => {
    const { title, values, onClose, selectedValue, isOpen, cancelString, okString } = props;
    /** @type {[string, React.Dispatch<string>]} */
    const [currentValue, setCurrentValue] = useState(selectedValue);
    const cancelStr = (cancelString) ? cancelString : 'Cancel';
    const okStr = (okString) ? okString : 'OK';

    const handleCancel = () => {
        onClose(null);
        setCurrentValue(selectedValue);
    };

    const handleOk = () => {
        onClose(currentValue);
    };

    /**
     * @param {string} value
     */
    const handleListItemClick = (value) => {
        setCurrentValue(value);
    };

    return (
        <Dialog onClose={ handleCancel } open={ isOpen }>
            <DialogTitle>{title}</DialogTitle>
            <List sx={ { pt: 0 } }>
                {values.map((val) => (
                    <ListItem key={ val } disableGutters>
                        <ListItemButton onClick={ () => handleListItemClick(val) } key={ val }>
                            <Checkbox checked={ currentValue === val } />
                            <ListItemText primary={ val } />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <div style={ { display: 'flex', justifyContent: 'space-around', padding: '1em' } }>
                <Button variant='outlined' onClick={ handleCancel }>{cancelStr}</Button>
                <Button variant='contained' onClick={ handleOk }>{okStr}</Button>
            </div>
        </Dialog>
    );
};

SimpleDialog.propTypes = {
    title: PropTypes.string,
    values: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    selectedValue: PropTypes.string,
    cancelString: PropTypes.string,
    okString: PropTypes.string,
};

export default SimpleDialog;
