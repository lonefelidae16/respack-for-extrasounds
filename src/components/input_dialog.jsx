'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Box, Button, Dialog, DialogActions, DialogTitle, TextField } from '@mui/material';

/**
 * @param {{
 *      title: string,
 *      desc: string,
 *      value: string,
 *      label: string,
 *      helperText: string,
 *      autoCompleteSelection: string[],
 *      onChange: (value: string) => void,
 *      onClose: (result: string | null) => void,
 *      isError: boolean,
 *      isOpen: boolean,
 *      required: boolean,
 *      variant: string,
 *      cancelString: string,
 *      okString: string,
 * }} props
 */
const InputDialog = (props) => {
    const { title, desc, value, label, helperText, autoCompleteSelection, onChange, onClose,
        isError, isOpen, required, variant, cancelString, okString } = props;
    const { t } = useTranslation();
    const [currentValue, setCurrentValue] = useState(value);
    const cancelStr = cancelString ?? t('Cancel');
    const okStr = okString ?? t('OK');

    const isEmptyText = () => {
        return required && (typeof currentValue === 'string') && currentValue.length === 0;
    };

    const handleCancel = () => {
        onClose(null);
    };

    const handleOk = () => {
        if (!currentValue) {
            setCurrentValue('');
            return;
        }
        onClose(currentValue);
    };

    /**
     * @param {React.ChangeEvent} ev
     */
    const handleChange = (ev) => {
        if (onChange) {
            onChange(ev);
        }
        setCurrentValue(ev.target.value);
    };

    /**
     * @param {React.KeyboardEvent} ev
     */
    const handleKeyDown = (ev) => {
        if (ev.key.match(/enter/i)) {
            handleOk();
        }
        if (ev.key.match(/escape/i)) {
            handleCancel();
        }
    };

    return (
        <Dialog onClose={ handleCancel } open={ isOpen }>
            <DialogTitle>{title}</DialogTitle>
            <Box sx={ { margin: '1em' } }>
                <Box>{desc}</Box>
                <TextField
                    label={ label }
                    helperText={ isEmptyText() ? t('This field is required.') : helperText }
                    required={ required }
                    margin='dense'
                    variant={ variant }
                    error={ isError || isEmptyText() }
                    onChange={ handleChange }
                    onKeyDown={ handleKeyDown }
                    fullWidth
                />
            </Box>
            <DialogActions>
                <Button variant='outlined' onClick={ handleCancel }>{cancelStr}</Button>
                <Button variant='contained' onClick={ handleOk }>{okStr}</Button>
            </DialogActions>
        </Dialog>
    );
};

InputDialog.propTypes = {
    title: PropTypes.string,
    desc: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    helperText: PropTypes.string,
    variant: PropTypes.string,
    autoCompleteSelection: PropTypes.array,
    onChange: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    isError: PropTypes.bool,
    isOpen: PropTypes.bool,
    required: PropTypes.bool,
    cancelString: PropTypes.string,
    okString: PropTypes.string,
};

export default InputDialog;