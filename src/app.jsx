'use strict';

import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ExtraSounds from './model/extra_sounds.js';
import MinecraftAssets from './model/minecraft_assets.js';

import EditScreen from './screen/edit_screen.jsx';
import StartScreen from './screen/start_screen.jsx';

import './scss/index.scss';
import packageJson from '../package.json';

const vanillaAssetsJson = {};

const getAssetHash = function (fileName) {
    try {
        return vanillaAssetsJson['objects'][fileName]['hash'];
    } catch (error) {
        console.error(error);
    }
};

const playAsset = (fileName, volume, pitch) => {
    ExtraSounds.playSound(MinecraftAssets.getResourceUri(getAssetHash(fileName)), volume, pitch);
};

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const App = () => {
    const [someError, setSomeError] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('StartScreen');
    const [resPack, setResPack] = useState(null);

    useMemo(() => {
        document.title = packageJson.description;
    }, []);

    const createProject = (currentPack) => {
        MinecraftAssets.getAllMCAssetsJson(currentPack.getMCVerFromPackFormat())
            .then(json => {
                Object.keys(vanillaAssetsJson).forEach(key => delete vanillaAssetsJson[key]);
                Object.assign(vanillaAssetsJson, json);
                this.setState({
                    currentScreen: 'EditScreen',
                    resPack: currentPack,
                });
            })
            .catch(error => {
                console.error(error);
                this.setState({ someError: <>Failed to connect the Official Minecraft server. <a href='#' onClick={ () => location.reload() }>Try to reload this page?</a></> });
            });
    };

    return (
        <ThemeProvider theme={ darkTheme }>
            <CssBaseline />
            <div className='version-string'>{packageJson.version}</div>
            <StartScreen onResourcePackDetermined={ createProject } hidden={ currentScreen !== 'StartScreen' } />
            <EditScreen resPack={ resPack } hidden={ currentScreen !== 'EditScreen' } />
            <div className='error-msg' hidden={ !someError }>{someError}</div>
        </ThemeProvider>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
