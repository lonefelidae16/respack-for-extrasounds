'use strict';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import localized JSON files.
import l10nEnUs from './en_us.json';
import l10nJaJp from './ja_jp.json';

const cookieKey = 'i18n_locale';

const locales = {
    'en_us': 'English (US)',
    'ja_jp': '日本語',
};

const resources = {
    'en_us': {
        translation: l10nEnUs
    },
    'ja_jp': {
        translation: l10nJaJp
    },
};

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: 'en_us',
        interpolation: {
            escapeValue: false, // react already safes from xss
        }
    });

export { i18n, locales, cookieKey };
