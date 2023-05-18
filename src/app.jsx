'use strict';

import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { useCookies } from 'react-cookie';
import { Backdrop } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WebFont from 'webfontloader';

import ExtraSounds from './model/extra_sounds.js';

import { i18n, cookieKey } from './i18n/config.js';

import EditScreen from './screen/edit_screen.jsx';
import StartScreen from './screen/start_screen.jsx';
import MobileScreen from './screen/mobile_screen.jsx';
import SimpleBoxAnimator from './components/simple_box_animator.jsx';

import './scss/index.scss';
import packageJson from '../package.json';
import { StateHandler } from './util/globals.js';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});

WebFont.load({
    custom: {
        families: ['Minecraft']
    }
});

const App = () => {
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [currentScreen, setCurrentScreen] = useState((document.documentElement.clientWidth <= 768) ? 'MobileScreen' : 'StartScreen');
    const [mayBusyWait, setMayBusyWait] = useState(true);
    const [initialSoundsJson, setInitialSoundsJson] = useState({});
    const [cookies] = useCookies([cookieKey]);

    const { t } = useTranslation();

    useMemo(async () => {
        await ExtraSounds.fetchTagRevisionsAsync();
        document.title = packageJson.description;
        setMayBusyWait(false);
    }, []);

    useEffect(() => {
        if (cookies[cookieKey] && i18n.language !== cookies[cookieKey]) {
            i18n.changeLanguage(cookies[cookieKey]);
            setSomeError(null);
        }
    }, [cookies]);

    /**
     * @param {boolean} state
     */
    const shouldShowBackdrop = (state) => {
        setMayBusyWait(state);
    };

    /**
     * Moves to the EditScreen when succeeded to fetch required data.
     *
     * @param {import('./model/minecraft_res_pack.js').default} currentPack Target ResourcePack.
     * @param {string} extraSoundsVer                                       Target ExtraSounds version.
     */
    const createProject = (currentPack, extraSoundsVer) => {
        StateHandler.createProjectAsync(currentPack, extraSoundsVer)
            .then(() => {
                setInitialSoundsJson(currentPack.soundsJson);
                setCurrentScreen('EditScreen');
            }).catch(() => {
                setSomeError(<>{t('Failed to connect the Official Minecraft server.')} <a href='#' onClick={ () => location.reload() }>{t('Try to reload this page?')}</a></>);
            }).finally(() => {
                setMayBusyWait(false);
            });
    };

    return (
        <ThemeProvider theme={ darkTheme }>
            <CssBaseline />
            <div className='version-string minecraft'>{packageJson.version}</div>
            <MobileScreen onContinueButtonPress={ () => setCurrentScreen('StartScreen') } hidden={ currentScreen !== 'MobileScreen' } />
            <StartScreen onCreateProject={ createProject } onChangeWaitState={ shouldShowBackdrop } hidden={ currentScreen !== 'StartScreen' } />
            <EditScreen initialSoundsJson={ initialSoundsJson } onChangeWaitState={ shouldShowBackdrop } hidden={ currentScreen !== 'EditScreen' } />
            <div className='error-msg center' hidden={ !someError }>{someError}</div>
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
