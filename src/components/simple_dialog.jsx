'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Dialog, DialogActions, DialogTitle, List, ListItemButton, ListItemText } from '@mui/material';

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
    const { t } = useTranslation();
    const { title, values, onClose, selectedValue, isOpen, cancelString, okString } = props;
    /** @type {[string, React.Dispatch<string>]} */
    const [currentValue, setCurrentValue] = useState(selectedValue);
    const cancelStr = cancelString ?? t('Cancel');
    const okStr = okString ?? t('OK');

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
                    <ListItemButton onClick={ () => handleListItemClick(val) } key={ val }>
                        <Checkbox checked={ currentValue === val } />
                        <ListItemText primary={ val } />
                    </ListItemButton>
                ))}
            </List>
            <DialogActions>
                <Button variant='outlined' onClick={ handleCancel }>{cancelStr}</Button>
                <Button variant='contained' onClick={ handleOk }>{okStr}</Button>
            </DialogActions>
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
