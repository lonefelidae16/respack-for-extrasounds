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
    const [loading, setLoading] = useState(false);
    const [resPackError, setResPackError] = useState(null);
    const [someError, setSomeError] = useState(null);
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

    const createProject = (currentPack) => {
        setResPackError(null);
        props.onResourcePackDetermined(currentPack);
    };

    const onChangeFile = (ev) => {
        setResPackError(null);
        const files = ev.target.files;
        if (!files || !files[0]) {
            return;
        }
        setLoading(true);
        MinecraftResPack.loadResPack(files[0]).then(resPack => {
            if (!resPack.soundsJson || !resPack.zip) {
                setResPackError(<>Error while reading resource pack: <br /><code>assets/extrasounds/sounds.json</code><br />does not exist or invalid.</>);
                setLoading(false);
            } else {
                createProject(resPack);
            }
        });
    };

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
            <div className='version-string'><Button size='small' variant='outlined' href='https://github.com/lonefelidae16/respack-for-extrasounds.git'>View source on GitHub</Button></div>
            <h3 className='center'>Minecraft ResourcePack editor for Mod ExtraSounds</h3>
            <footer className='center'>Made with ReactJS</footer>
            <div className='screen-start'>
                <div className='upload-file'>
                    <p>Continue Editing?</p>
                    <p>
                        <Button variant='contained' component='label' disabled={ loading }>
                    Choose Resource Pack
                            <input hidden name='file' type='file' accept='application/zip' onChange={ onChangeFile } />
                        </Button>
                        <div className='error-msg' hidden={ !resPackError }>{resPackError}</div>
                    </p>
                </div>
                <div className='create-new'>
                    <p>Start Customization.</p>
                    <p>
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
                    </p>
                    <p>
                        <Button variant='contained' color='secondary' disabled={ loading } onClick={ onCreateBlank }>Create New Project</Button>
                        <div className='error-msg' hidden={ !someError }>{someError}</div>
                    </p>
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
};

export default StartScreen;
