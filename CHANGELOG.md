# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### ⏳ Coming

* Zip file-tree customization feature such as can be added an ogg sound file.
* Supports custom namespace.

### 🐛 Bugs

<!--* <small>_Any bugs/issues will be written here when found._</small>-->
* Retarget ResourcePack feature is still work in progress.

## [0.2.2-indev] - 2023-05-20 JST
### ✨ Added
* If ResourcePack contains source entry and when be clicked, focus it and open accordion.
* Check if the sound entry makes infinite loop.<br>
  This will be caused both entry and sound have the same name
  (such as `action.bow` includes `extrasounds:action.bow` and its type is marked as Event).

### 🔧 Fixed
* CORS check update in `curl.php` for proxy site.
* Limit the item count for the searched results.
* More carefully to handle sound entries.

### 👷 Technical

* Add shell script `po2json.sh` to convert from GNU Gettext (`po`) format to json.
* Add pot template to make easy localization.

## [0.2.1-indev] - 2023-05-19 JST
### 🔧 Fixed

* Crash when clear Sound Name field.

### 👷 Technical

* Item count can be specified with prop `limitCount` when rendering SoundEntryVisualizer.
* Add Type hint and JSDoc.

## [0.2.0-indev] - 2023-05-18 JST
### ✨ Added

* Autocomplete feature for EntryName which autogen by ExtraSounds.
* Autocomplete feature for SoundName input.
* Search entries feature of `sounds.json`.<br>
  Needs to be filtered due to rendering issue.
* Add a new entry to `sounds.json` and name it.
* Add a new sound to entry.
* Displays slider label of Volume and Pitch during sound editing.

### 🔧 Fixed

* Confirmation dialog now displays only when ResourcePack structure has been changed.
* Missing translations on EditScreen.
* Disallow to register an empty entry name to `sounds.json`.
* CORS check fix in `curl.php`.
* Now uses `structedClone` instead of shallow copy when modifying `sounds.json`.

### 👷 Technical

* Optimize ResourcePack handling:<br>
  Whole object copy including `zip`, `pack.mcmeta` and `sounds.json` -> copy `sounds.json` only.
* Adopt Null coalescing operator (`operand ?? defaultValue`).
* Reduce states from `React.Component`.

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
