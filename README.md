# Setup

## Installation

- delete `package-lock.json`
- `npm install`

## Visual Studio Code

Open in Visual Studio Code and run these tasks:

- `generate geometry typescript classes`
- `build library`
- `run example`

## Command Line Alternative

```shell
cd projects\harness-browser3d-library

npx openapi-typescript assets\geometry-api.yaml --output src\generated\geometry.ts

ng build harness-browser3d-library --configuration production

ng serve --open
```
