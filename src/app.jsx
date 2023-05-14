'use strict';

import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Backdrop } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WebFont from 'webfontloader';

import ExtraSounds from './model/extra_sounds.js';

import EditScreen from './screen/edit_screen.jsx';
import StartScreen from './screen/start_screen.jsx';
import MobileScreen from './screen/mobile_screen.jsx';
import SimpleBoxAnimator from './components/simple_box_animator.jsx';

import './scss/index.scss';
import packageJson from '../package.json';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});

const appName = packageJson.description;

WebFont.load({
    custom: {
        families: ['Minecraft']
    },
    active: () => {
        document.body.classList.add('webfont-active');
    }
});

const App = () => {
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [currentScreen, setCurrentScreen] = useState((document.documentElement.clientWidth <= 768) ? 'MobileScreen' : 'StartScreen');
    // const [currentScreen, setCurrentScreen] = useState('EditScreen');
    const [mayBusyWait, setMayBusyWait] = useState(true);

    /** @type {React.MutableRefObject<{withState: (obj: {resPack: MinecraftResPack, extraSoundsVer: string}) => Promise<void>}>} */
    const editScreenRef = useRef();

    useMemo(async () => {
        await ExtraSounds.fetchTagRevisionsAsync();
        document.title = appName;
        setMayBusyWait(false);
    }, []);

    const shouldShowBackdrop = (state) => {
        setMayBusyWait(state);
    };

    /**
     * Moves to the EditScreen when succeeded to fetch required data.
     *
     * @param {MinecraftResPack} currentPack Target ResourcePack.
     * @param {string} extraSoundsVer        Target ExtraSounds version.
     */
    const createProject = async (currentPack, extraSoundsVer) => {
        return editScreenRef.current.withState({
            resPack: currentPack,
            extraSoundsVer,
        }).then(() => {
            setCurrentScreen('EditScreen');
        }).catch(() => {
            setSomeError(<>Failed to connect the Official Minecraft server. <a href='#' onClick={ () => location.reload() }>Try to reload this page?</a></>);
        });
    };

    return (
        <ThemeProvider theme={ darkTheme }>
            <CssBaseline />
            <div className='version-string'>{packageJson.version}</div>
            <MobileScreen name={ appName } onContinueButtonPress={ () => setCurrentScreen('StartScreen') } hidden={ currentScreen !== 'MobileScreen' } />
            <StartScreen name={ appName } onCreateProject={ createProject } onChangeWaitState={ shouldShowBackdrop } hidden={ currentScreen !== 'StartScreen' } />
            <EditScreen name={ appName } ref={ editScreenRef } onChangeWaitState={ shouldShowBackdrop } hidden={ currentScreen !== 'EditScreen' } />
            <div className='error-msg' hidden={ !someError }>{someError}</div>
            <Backdrop
                sx={ { color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 } }
                open={ mayBusyWait }
            >
                <SimpleBoxAnimator />
            </Backdrop>
        </ThemeProvider>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
