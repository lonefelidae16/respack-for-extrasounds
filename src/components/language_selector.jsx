'use strict';

import React, { useState } from 'react';
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';

import { i18n, locales, cookieKey } from '../i18n/config';
import { CookiesProvider, useCookies } from 'react-cookie';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
    const [cookies, setCookie] = useCookies([cookieKey]);
    /** @type {[string, React.Dispatch<string>]} */
    const [lang, setLang] = useState((cookies[cookieKey] ?? i18n.language));

    const { t } = useTranslation();

    const onChangeLanguage = (lang) => {
        setLang(lang);
        setCookie(cookieKey, lang);
    };

    return (
        <CookiesProvider>
            <FormControl variant='standard' size='small' sx={ { minWith: 240 } }>
                <InputLabel id='lang-select-label'>{t('Language')}</InputLabel>
                <Select
                    id='lang-select'
                    value={ lang }
                    label={ t('Language') }
                    onChange={ (ev) => onChangeLanguage(ev.target.value) }
                >
                    {Object.keys(i18n.options.resources).map(lng => <MenuItem key={ lng } value={ lng }>{locales[lng]}</MenuItem>)}
                </Select>
            </FormControl>
        </CookiesProvider>
    );
};

export default LanguageSelector;

