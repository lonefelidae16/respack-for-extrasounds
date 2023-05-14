'use strict';

import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * @param {{
 *      hidden: boolean,
 *      onContinueButtonPress: () => void,
 * }} props
 */
const MobileScreen = (props) => {
    return (props.hidden) ? null : (
        <main className='center'>
            <h3>{props.name}</h3>
            <p><span className='c-fab c-fab-caution' /> CAUTION <span className='c-fab c-fab-caution' /></p>
            <p>Consider using the Desktop browser.</p>
            <p>This app is not designed for Mobile or Tablet devices.</p>
            <Button variant='contained' color='error' onClick={ () => props.onContinueButtonPress() }>Continue anyway</Button>
        </main>
    );
};

MobileScreen.propTypes = {
    hidden: PropTypes.bool,
    onContinueButtonPress: PropTypes.func,
    name: PropTypes.string,
};

export default MobileScreen;

