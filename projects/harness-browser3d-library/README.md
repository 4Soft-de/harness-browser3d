# Harness Browser 3D

A high performance angular component for displaying 3D representations of bordnet harnesses. Harness element selection and coloring is also supported.

## Usage

```html
<lib-harness-browser3d
  [addHarness]="data"
  [selectedIds]="selectedIds"
  [colors]="colors"
  [settings]="settings"
  (initialized)="addAPI($event)"
></lib-harness-browser3d>
```

```ts
export class AppComponent {
  data: Harness;
  selectedIds: string[];
  colors: SetColorAPIStruct[];
  settings: SettingsAPIStruct;
  api: HarnessBrowser3dLibraryAPI;

  addAPI(api: HarnessBrowser3dLibraryAPI) {
    this.api = api;
  }
}
```

# References

## Angular and Three

https://github.com/JohnnyDevNull/ng-three-template/tree/609599460458974f0a9cad8ba5e6586cef109231/src/app/engine
MIT License

- canvas element in template
- initialize renderer with canvas element
- animate loop outside angular in ngZone

## API

https://www.ag-grid.com/angular-data-grid/grid-api/
MIT License

- component returns api object
