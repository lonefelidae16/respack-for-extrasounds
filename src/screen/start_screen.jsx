'use strict';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import MinecraftResPack from '../model/minecraft_res_pack';
import ExtraSounds from '../model/extra_sounds';

const ESTags = [];
const ESVersOptionsJSX = [
    <MenuItem key='dev' value='dev' defaultChecked>Branch dev</MenuItem>,
];

const StartScreen = (props) => {
    /** @type {[boolean, React.Dispatch<boolean>]} */
    const [loading, setLoading] = useState(false);
    /** @type {[JSX.Element, React.Dispatch<JSX.Element>]} */
    const [resPackError, setResPackError] = useState(null);
    /** @type {[JSX.Element, React.Dispatch<JSX.Element>]} */
    const [someError, setSomeError] = useState(null);
    /** @type {[string, React.Dispatch<string>]} */
    const [extraSoundsVer, setExtraSoundsVer] = useState('dev');

    useMemo(() => {
        ExtraSounds.fetchTagRevisions().then(revs => {
            revs.forEach(rev => {
                const tagName = rev['tag'];
                ESVersOptionsJSX.push(<MenuItem key={ tagName } value={ tagName }>{tagName}</MenuItem>);
                ESTags.push(rev);
            });
        }).catch(() => {
            setSomeError(<>Failed to fetch tags from GitHub.</>);
        });
    }, []);

    /**
     * Calls the App#onResourcePackDetermined.
     *
     * @param {MinecraftResPack} currentPack Target ResourcePack.
     */
    const createProject = (currentPack) => {
        setResPackError(null);
        props.onResourcePackDetermined(currentPack);
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
        setLoading(true);
        MinecraftResPack.loadResPack(files[0]).then(resPack => {
            if (!resPack.zip) {
                setResPackError(<>Error while unzipping resource pack.</>);
                setLoading(false);
            } else if (!resPack.soundsJson) {
                setResPackError(<>Error while reading resource pack:<br /><code>assets/extrasounds/sounds.json</code><br />does not exist or invalid.</>);
                setLoading(false);
            } else {
                createProject(resPack);
            }
        });
    };

    /**
     * Creates blank project.
     */
    const onCreateBlank = () => {
        setLoading(true);
        let mcVer = 'latest';
        ESTags.forEach(tag => {
            if (tag['tag'] !== extraSoundsVer) {
                return;
            }
            mcVer = tag['minecraft_version'];
        });
        const newPack = new MinecraftResPack();
        newPack.setPackFormatFromMCVer(mcVer);
        createProject(newPack);
    };

    return (props.hidden) ? null : (
        <main>
            <div className='version-string'><Button size='small' variant='outlined' target='_blank' href='https://github.com/lonefelidae16/respack-for-extrasounds.git'>View source on GitHub <span className='c-fab c-fab-external-link' /></Button></div>
            <h3 className='center'>{props.name}</h3>
            <footer className='center'>Made with ReactJS</footer>
            <div className='screen-start'>
                <div className='upload-file'>
                    <p>Continue Editing?</p>
                    <Button variant='contained' component='label' disabled={ loading }>
                        Choose Resource Pack
                        <input hidden name='file' type='file' accept='application/zip' onChange={ onChangeFile } />
                    </Button>
                    <div className='error-msg' hidden={ !resPackError }>{resPackError}</div>
                </div>
                <div className='create-new'>
                    <p>Start Customization.</p>
                    <div style={ { marginBottom: '1em' } }>
                        <FormControl fullWidth>
                            <InputLabel id='ver-select-label'>ExtraSounds Version</InputLabel>
                            <Select
                                labelId='ver-select-label'
                                id='ver-select'
                                value={ extraSoundsVer }
                                label='ExtraSounds Version'
                                onChange={ ev => setExtraSoundsVer(ev.target.value) }
                            >
                                {ESVersOptionsJSX}
                            </Select>
                        </FormControl>
                    </div>
                    <Button variant='contained' color='secondary' disabled={ loading } onClick={ onCreateBlank }>Create New Project</Button>
                    <div className='error-msg center' hidden={ !someError }>{someError}</div>
                </div>
            </div>
            <div id='splash-animator' className={ loading ? '' : 'hide' }>
                <div className='surface surface-top' />
                <div className='surface surface-frontside' />
                <div className='surface surface-rightside' />
                <div className='surface surface-leftside' />
            </div>
        </main>
    );
};

StartScreen.propTypes = {
    onResourcePackDetermined: PropTypes.func,
    hidden: PropTypes.bool,
    name: PropTypes.string,
};

export default StartScreen;
