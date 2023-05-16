'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { i18n } from '../i18n/config';

import MinecraftResPack from '../model/minecraft_res_pack.js';
import ExtraSounds from '../model/extra_sounds.js';

import ESVersionSelector from '../components/es_version_selector.jsx';
import LanguageSelector from '../components/language_selector.jsx';
import ExternalLink from '../icons/external_link.jsx';
import ReactIcon from '../icons/react_icon.jsx';

import packageJson from '../../package.json';

/**
 * @param {{
 *      onChangeWaitState: (state: boolean) => void,
 *      onCreateProject: (resPack: MinecraftResPack, extraSoundsVer: string) => Promise<void>,
 *      hidden: boolean,
 * }} props
 */
const StartScreen = (props) => {
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [resPackError, setResPackError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [extraSoundsVer, setExtraSoundsVer] = useState(ExtraSounds.defaultRef);

    const { hidden, onChangeWaitState, onCreateProject } = props;

    const { t } = useTranslation();

    i18n.on('languageChanged', () => {
        setResPackError(null);
    });

    /**
     * Calls the App#onCreateProject.
     *
     * @param {MinecraftResPack} currentPack Target ResourcePack.
     */
    const createProject = (currentPack) => {
        setResPackError(null);
        onCreateProject(currentPack, extraSoundsVer);
    };

    /**
     * Handles file upload event.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} ev The event.
     */
    const onChangeFile = (ev) => {
        setResPackError(null);
        const files = ev.target.files;
        if (!files || !files[0]) {
            return;
        }
        onChangeWaitState(true);
        MinecraftResPack.loadResPack(files[0]).then(resPack => {
            if (!resPack.zip) {
                setResPackError(<>{t('Error while unzipping resource pack.')}</>);
                onChangeWaitState(false);
            } else if (!resPack.soundsJson) {
                setResPackError(<>{t('Error while reading resource pack:')}<br />{t('Following files are missing or invalid.')}<br /><code>assets/extrasounds/sounds.json</code></>);
                onChangeWaitState(false);
            } else {
                setExtraSoundsVer(ExtraSounds.getLatestRevFromMCVer(resPack.getMCVerFromPackFormat()));
                createProject(resPack);
            }
        });
    };

    /**
     * Creates blank project.
     */
    const onCreateBlank = () => {
        onChangeWaitState(true);
        const newPack = new MinecraftResPack();
        newPack.setPackFormatFromMCVer(ExtraSounds.getCompatMCVerFromExtraSoundsVer(extraSoundsVer));
        createProject(newPack);
    };

    return (hidden) ? null : (
        <main>
            <div className='version-string'><Button size='small' variant='outlined' target='_blank' href='https://github.com/lonefelidae16/respack-for-extrasounds.git'>{t('View source on GitHub')} <ExternalLink /></Button></div>
            <h2 className='center minecraft'>{packageJson.description}</h2>
            <footer className='center'>Made with ReactJS<ReactIcon width='1.2rem' height='1.2rem' /></footer>
            <div className='screen-start'>
                <div className='upload-file'>
                    <p>{t('Continue Editing?')}</p>
                    <Button variant='contained' component='label'>
                        {t('Choose Resource Pack')}
                        <input hidden name='file' type='file' accept='application/zip' onChange={ onChangeFile } />
                    </Button>
                    <div className='error-msg' hidden={ !resPackError }>{resPackError}</div>
                </div>
                <div className='create-new'>
                    <p>{t('Start Customization.')}</p>
                    <div style={ { marginBottom: '1em' } }><ESVersionSelector onExtraSoundsVerChanged={ (ver) => setExtraSoundsVer(ver) } /></div>
                    <Button variant='contained' color='secondary' onClick={ onCreateBlank }>{t('Create New Project')}</Button>
                </div>
            </div>
            <div className='center' style={ { marginTop: '1em' } }>
                <LanguageSelector /><br />
                <small>* {t('Localization feature is currently under development.')} *</small>
            </div>
        </main>
    );
};

StartScreen.propTypes = {
    onCreateProject: PropTypes.func,
    hidden: PropTypes.bool,
    onChangeWaitState: PropTypes.func,
};

export default StartScreen;
