# ResourcePack Editor for ExtraSounds

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

A WebApp to assist in the creation and customization of the Minecraft’s ResourcePack for Mod [ExtraSounds](https://github.com/lonefelidae16/extra-sounds.git).

* UnZip and analyze Minecraft’s ResourcePack structure.
* Edit ExtraSounds’ `sounds.json` including auto-generated entries.
* The modified ResourcePack can be downloaded.
* Sound preview feature. Fetch and play sounds from Minecraft’s official resource.

[App is available here](https://www.kow08absty.com/extrasounds/respack-editor/). It does not support full-scale customization at the moment,
but you can also get a Zip file as a substitute for a template.

## Build from source

This app is built with [React](https://react.dev/), and partially uses [PHP](https://php.net/).
Prerequisite knowledges are about [NodeJS](https://nodejs.org/), PHP and HTTP Web Server.

### Prerequisites

* NodeJS v18.x
* npm 9.5.x
* PHP 8
* HTTP server which supports PHP, such as Apache, Nginx, IIS and so on.

[Docker](https://www.docker.com/) environment is also available. If you want to use this, please prepare following:
* Docker 23
* Docker compose

### Get the source and Build

```sh
> git clone https://github.com/lonefelidae16/respack-for-extrasounds.git
> cd respack-for-extrasounds
> npm i
> npm run build
```

The generated files are in `dist/` . Open `index.html` via your localhost server, or upload them on remote server.

If you want to use Docker, you need to copy `docker-compose.yml.example` to `docker-compose.yml` before starting up.

Docker’s nginx opens port `8080` by default. If you have a port binding problem, you need to change it.

```sh
> cp docker-compose.yml.example docker-compose.yml
> nano docker-compose.yml  # if needed
> docker-compose up -d
```

And then access http://localhost:8080/ .

`Development` mode is also available, run `npm run watch` if you want. The terminal will be locked, so use <kbd>Ctrl</kbd>+<kbd>C</kbd> to exit.

To stop the docker container, run it:
```sh
> docker-compose down
```

## Contributing

Contributions are always welcome.
We use [Husky](https://typicode.github.io/husky/#/), so [ESLint](https://eslint.org/) and [StyleLint](https://stylelint.io/) will format your code before committing.
Feel free to open a Pull Request from your fork.

[Visual Studio Code](https://code.visualstudio.com/) integration is also available.
Get extension from Microsoft’s marketplace: [ESLint for VSCode](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint),
[Stylelint for VSCode](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)


Here is a partial list of code rules. See `.eslintrc` and `.stylelintrc` for more information.

* Indentation: 4 spaces
* Quotes: single
* One-line `if` statement: not allowed
* Variables: camelCase
* Semicolon: always
* Curly spacing: always
