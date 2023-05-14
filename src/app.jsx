'use strict';

import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ExtraSounds from './model/extra_sounds.js';
import MinecraftResPack from './model/minecraft_res_pack.js';
import MinecraftAssets from './model/minecraft_assets.js';

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
        document.title = 'ResourcePack Editor for ExtraSounds';
    }, []);

    const createProject = (currentPack) => {
        MinecraftAssets.getAllMCAssetsJson(currentPack.getMCVerFromPackFormat())
            .then(json => {
                Object.assign(vanillaAssetsJson, json);
                setCurrentScreen('EditScreen');
                setResPack(currentPack);
            })
            .catch(error => {
                console.error(error);
                setSomeError('Failed to connect the Official Minecraft server.');
            });
    };

    return (
        <ThemeProvider theme={ darkTheme }>
            <CssBaseline />
            <h1>Hello World!</h1>
        </ThemeProvider>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
