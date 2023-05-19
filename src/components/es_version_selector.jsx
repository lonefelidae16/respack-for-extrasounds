'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import ExtraSounds from '../model/extra_sounds';

const esDefaultRef = ExtraSounds.defaultRef;

const ESVersionSelector = (props) => {
    /** @type {[string, React.Dispatch<string>]} */
    const [extraSoundsVer, setExtraSoundsVer] = useState(props.defaultSelect ?? esDefaultRef);

    const { t } = useTranslation();

    /**
     * @param {import('@mui/material').SelectChangeEvent<string>} ev
     */
    const onExtraSoundsVerChanged = (ev) => {
        setExtraSoundsVer(ev.target.value);
        props.onExtraSoundsVerChanged(ev.target.value);
    };

    return (
        <FormControl fullWidth>
            <InputLabel id='ver-select-label'>ExtraSounds {t('version')}</InputLabel>
            <Select
                labelId='ver-select-label'
                id='ver-select'
                value={ extraSoundsVer }
                label={ `ExtraSounds ${t('version')}` }
                disabled={ props.disabled }
                onChange={ onExtraSoundsVerChanged }
            >
                <MenuItem key={ esDefaultRef } value={ esDefaultRef } defaultChecked={ esDefaultRef === props.defaultSelect }>Branch dev</MenuItem>
                {
                    ExtraSounds.revisions.map((ver) => {
                        const tagName = ver['tag'];
                        return <MenuItem key={ tagName } value={ tagName } defaultChecked={ tagName === props.defaultSelect }>{tagName}</MenuItem>;
                    })
                }
            </Select>
        </FormControl>
    );
};

ESVersionSelector.propTypes = {
    onExtraSoundsVerChanged: PropTypes.func,
    defaultSelect: PropTypes.string,
    disabled: PropTypes.bool,
};

export default ESVersionSelector;
