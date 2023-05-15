'use strict';

import * as React from 'react';

const ExternalLink = (props) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' strokeWidth={ 3 } stroke='currentColor' width='1em' height='1em' { ...props }>
        <path
            d='M39 24v15c0 2-1 3-3 3H9c-2 0-3-1-3-3V12c0-2 1-3 3-3h15m0 15L45 3m0 17V3H28'
        />
    </svg>
);

export default ExternalLink;
