# Setup

## Installation

- `npm clean-install`

## Visual Studio Code

Open in Visual Studio Code and run these tasks:

- `build library`
- `run example`

## Command Line Alternative

```shell
npm run build:library:dev
npm start
```

# Publishing

To publish the lib:

1. Checkout master + merge develop into master
2. Update version in package.json in root and in package.json in projects/harness-browser3d-library to the new version
3. Create tag with version (e.g. `0.3.4`)
4. IMPORTANT: Re-build project completely with

```shell
npm run build:library:prod
```

5. Use the following commands to publish to npm

```shell
cd dist\harness-browser3d-library

npm login

npm publish --access public
```
