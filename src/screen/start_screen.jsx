'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

import MinecraftResPack from '../model/minecraft_res_pack.js';
import ESVersionSelector from '../components/es_version_selector.jsx';
import ExtraSounds from '../model/extra_sounds.js';

import ExternalLink from '../icons/external_link.jsx';
import ReactIcon from '../icons/react_icon.jsx';

/**
 * @param {{
 *      onChangeWaitState: (state: boolean) => void,
 *      onCreateProject: (resPack: MinecraftResPack, extraSoundsVer: string) => Promise<void>,
 *      hidden: boolean,
 *      name: string,
 * }} props
 */
const StartScreen = (props) => {
    /** @type {[React.JSX.Element, React.Dispatch<React.JSX.Element>]} */
    const [resPackError, setResPackError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [extraSoundsVer, setExtraSoundsVer] = useState(ExtraSounds.defaultRef);

    const { hidden, name, onChangeWaitState, onCreateProject } = props;

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
                setResPackError(<>Error while unzipping resource pack.</>);
                onChangeWaitState(false);
            } else if (!resPack.soundsJson) {
                setResPackError(<>Error while reading resource pack:<br /><code>assets/extrasounds/sounds.json</code><br />does not exist or invalid.</>);
                onChangeWaitState(false);
            } else {
                setExtraSoundsVer(ExtraSounds.getLatestVerFromMCVer(resPack.getMCVerFromPackFormat()));
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
            <div className='version-string'><Button size='small' variant='outlined' target='_blank' href='https://github.com/lonefelidae16/respack-for-extrasounds.git'>View source on GitHub <ExternalLink /></Button></div>
            <h2 className='center minecraft'>{name}</h2>
            <footer className='center'>Made with ReactJS<ReactIcon width='1.2rem' height='1.2rem' /></footer>
            <div className='screen-start'>
                <div className='upload-file'>
                    <p>Continue Editing?</p>
                    <Button variant='contained' component='label'>
                        Choose Resource Pack
                        <input hidden name='file' type='file' accept='application/zip' onChange={ onChangeFile } />
                    </Button>
                    <div className='error-msg' hidden={ !resPackError }>{resPackError}</div>
                </div>
                <div className='create-new'>
                    <p>Start Customization.</p>
                    <div style={ { marginBottom: '1em' } }><ESVersionSelector onExtraSoundsVerChanged={ (ver) => setExtraSoundsVer(ver) } /></div>
                    <Button variant='contained' color='secondary' onClick={ onCreateBlank }>Create New Project</Button>
                </div>
            </div>
        </main>
    );
};

StartScreen.propTypes = {
    onCreateProject: PropTypes.func,
    hidden: PropTypes.bool,
    name: PropTypes.string,
    onChangeWaitState: PropTypes.func,
};

export default StartScreen;
