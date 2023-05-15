'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

import Caution from '../icons/caution.jsx';

/**
 * @param {{
 *      hidden: boolean,
 *      name: string,
 *      onContinueButtonPress: () => void,
 * }} props
 */
const MobileScreen = (props) => {
    const { t } = useTranslation();

    return (props.hidden) ? null : (
        <main className='center'>
            <h2 className='minecraft'>{props.name}</h2>
            <p><Caution /> {t('CAUTION')} <Caution /></p>
            <p>{t('Consider using the Desktop browser.')}</p>
            <p>{t('This app is not designed for Mobile or Tablet devices.')}</p>
            <Button variant='contained' color='error' onClick={ () => props.onContinueButtonPress() }>{t('Continue anyway')}</Button>
        </main>
    );
};

MobileScreen.propTypes = {
    hidden: PropTypes.bool,
    onContinueButtonPress: PropTypes.func,
    name: PropTypes.string,
};

export default MobileScreen;

