'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const EditScreen = (props) => {
    return (props.hidden) ? null : (
        <main>
            I am EditScreen!
        </main>
    );
};

EditScreen.propTypes = {
    hidden: PropTypes.bool,
    resPack: PropTypes.object,
};

export default EditScreen;
