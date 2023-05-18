'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { ListSubheader, Typography, useMediaQuery, useTheme } from '@mui/material';
import { VariableSizeList } from 'react-window';

const LISTBOX_PADDING = 8; // px

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
    const outerProps = React.useContext(OuterElementContext);
    return <div ref={ ref } { ...props } { ...outerProps } />;
});

OuterElementType.displayName = '';

const renderRow = (props) => {
    const { data, index, style } = props;
    const dataSet = data[index];
    const inlineStyle = {
        ...style,
        top: style.top + LISTBOX_PADDING,
    };

    if (dataSet['group'] !== undefined) {
        return (
            <ListSubheader key={ dataSet.key } component='div' style={ inlineStyle }>
                {dataSet.group}
            </ListSubheader>
        );
    }

    return (
        <Typography component='li' { ...dataSet[0] } noWrap style={ inlineStyle }>
            {dataSet[1]}
        </Typography>
    );
};

const useResetCache = (data) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
};

// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = [];
    children.forEach((item) => {
        itemData.push(item);
        itemData.push(...(item.children || []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
        noSsr: true,
    });
    const itemCount = itemData.length;
    const itemSize = smUp ? 36 : 48;

    const getChildSize = (child) => {
        if (child['group'] !== undefined) {
            return 48;
        }

        return itemSize;
    };

    const getHeight = () => {
        if (itemCount > 8) {
            return 8 * itemSize;
        }
        return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    };

    const gridRef = useResetCache(itemCount);

    return (
        <div ref={ ref }>
            <OuterElementContext.Provider value={ other }>
                <VariableSizeList
                    itemData={ itemData }
                    height={ getHeight() + 2 * LISTBOX_PADDING }
                    width='100%'
                    ref={ gridRef }
                    outerElementType={ OuterElementType }
                    innerElementType='ul'
                    itemSize={ (index) => getChildSize(itemData[index]) }
                    overscanCount={ 5 }
                    itemCount={ itemCount }
                >
                    {renderRow}
                </VariableSizeList>
            </OuterElementContext.Provider>
        </div>
    );
});

ListboxComponent.propTypes = {
    children: PropTypes.any,
};

export default ListboxComponent;