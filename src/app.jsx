'use strict';

import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import MinecraftAssets from './model/minecraft_assets.js';

import EditScreen from './screen/edit_screen.jsx';
import StartScreen from './screen/start_screen.jsx';
import MobileScreen from './screen/mobile_screen.jsx';

import './scss/index.scss';
import packageJson from '../package.json';

const vanillaAssetJson = {};

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const App = (props) => {
    /** @type {[JSX.Element, React.Dispatch<JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [currentScreen, setCurrentScreen] = useState((document.documentElement.clientWidth <= 768) ? 'MobileScreen' : 'StartScreen');

    const editScreenRef = useRef();

    useMemo(() => {
        document.title = props.name;
    }, [props.name]);

    /**
     * Moves to the EditScreen when succeeded to fetch required data.
     *
     * @param {MinecraftResPack} currentPack Target ResourcePack.
     */
    const createProject = (currentPack) => {
        MinecraftAssets.getAllMCAssetsJson(currentPack.getMCVerFromPackFormat())
            .then(json => {
                Object.keys(vanillaAssetJson).forEach(key => delete vanillaAssetJson[key]);
                Object.assign(vanillaAssetJson, json);
                editScreenRef.current.withState(currentPack, vanillaAssetJson);
                setCurrentScreen('EditScreen');
            })
            .catch(() => {
                setSomeError(<>Failed to connect the Official Minecraft server. <a href='#' onClick={ () => location.reload() }>Try to reload this page?</a></>);
            });
    };

    return (
        <ThemeProvider theme={ darkTheme }>
            <CssBaseline />
            <div className='version-string'>{packageJson.version}</div>
            <MobileScreen name={ props.name } onContinueButtonPress={ () => setCurrentScreen('StartScreen') } hidden={ currentScreen !== 'MobileScreen' } />
            <StartScreen name={ props.name } onResourcePackDetermined={ createProject } hidden={ currentScreen !== 'StartScreen' } />
            <EditScreen name={ props.name } ref={ editScreenRef } hidden={ currentScreen !== 'EditScreen' } />
            <div className='error-msg' hidden={ !someError }>{someError}</div>
        </ThemeProvider>
    );
};

App.propTypes = {
    name: PropTypes.string,
};

const root = createRoot(document.getElementById('root'));
root.render(<App name={ packageJson.description } />);
