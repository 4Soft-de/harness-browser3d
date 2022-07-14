# Harness Browser 3D

A high performance angular component for displaying 3D representations of bordnet harnesses. Harness element selection, arbitrary coloring and custom views are also supported.

## Usage

```html
<lib-harness-browser3d
  [addHarness]="data"
  [selectedIds]="selectedIds"
  [colors]="colors"
  [settings]="settings"
  [showStats]="htmlElement"
  (initialized)="addAPI($event)"
></lib-harness-browser3d>
```

```ts
class AppComponent {
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

It is recommended to set the change detection strategy of the parent component to `OnPush`. It improves the performance when moving the camera.

### Add a Harness

Add a harness by inserting a `Harness` object into the `addHarness` property. Include Harness from `api\alias.ts`.

Harness has been generated from `assets\geometry-api.yaml`.

### Select Ids

Select harness elements by inserting an array of harness element ids into the `selectedIds` property.

All harness elements must belong to the same harness and the harness must have been added before.

### Set Colors

Set arbitrary colors for harness elements by inserting an array of `SetColorAPIStruct` objects into the `colors` property. Include SetColorAPIStruct from `api\structs.ts`.

All harness elements must belong to the same harness and the harness must have been added before.

### Apply Settings

Apply settings by inserting an array of `SettingsAPIStruct` objects into the `settings` property. Include SettingsAPIStruct from `api\structs.ts`.

### Additional API

A `HarnessBrowser3dLibraryAPI` object is used to invoke certain actions, like resetting the camera. It is passed in the `initialized` event directly after the component has been initialized. Include HarnessBrowser3dLibraryAPI from `api\api.ts`.

## Views

Predefined and also custom views on the harness geometries are supported. Predefined views are located in the `views` folder.

Views operate on string properties that are defined on the input harness data.

```json
{
  "id": "exampleId",
  "viewProperties": {
    "exampleProperty": "exampleValue"
  }
}
```

In this example an `exampleProperty` property is added to the object `exampleId` with value `exampleValue`.

### Apply Views

Pass the view into the `applyView` API function. The previous view is disposed.

### Define custom Views

Views are instances of `View` in `views\view.ts`.

```ts
class View {
  public readonly propertyKey: string;
  public readonly defaultValue: string;
  public readonly material: Material;
  public readonly mapper: (properties: string[]) => BufferAttribute;
}
```

- `propertyKey` is the property key in the input data and in the vertex shader
- `defaultValue` is the default value for harness elements without this property
- `material` contains the shaders for this view
- `mapper` is a function that processes the property values into a suitable buffer attribute

### Built-in Shader Attributes

Built-in shader attributes are controlled by the viewer and can be used by custom views.

- `vec3 pDefaultColor` is the default color of the corresponding harness element
- `vec3 pColor` is the specified color as set in the `colors` input property on the angular component

### Predefined Views

Diff

- property `diffState`
- values can be modified, unmodified, added, removed

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
