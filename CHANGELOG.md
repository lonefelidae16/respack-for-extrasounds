# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### ⏳ Coming

* Add a new entry to `sounds.json` and name it.
* Autocomplete feature that suggests the names of items as you type, including autogen entries by ExtraSounds.

### 🐛 Bugs

* <small>_Any bugs/issues will be written here when found._</small>

## [0.1.1-indev] - 2023-05-16 JST
### ✨ Added

* Displays confirmation message before leaving from the EditScreen.

### 🔧 Fixed

* To suppress error messages, it can no longer hit the play button repeatedly.
* Asset fetch fails when url includes `index.html`.

## [0.1.0-indev] - 2023-05-15 JST
### ✨ Added

* UnZip and analyze Minecraft’s ResourcePack structure.
* Edit ExtraSounds’ `sounds.json` for existing entries only.
* The modified ResourcePack can be downloaded.
* Fetch and play sounds from Minecraft’s official resource.
* Supports i18n. `en_US` and `ja_JP` are now available.
