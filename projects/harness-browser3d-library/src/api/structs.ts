export interface SettingsAPIStruct {
  geometryMode?: GeometryModeAPIEnum;
  splineMode?: SplineModeAPIEnum;
  segmentCount?: number;
  curveStepsFactor?: number;
  pixelRatio?: number;
}

export interface SetColorAPIStruct {
  id: string;
  colorR: number;
  colorG: number;
  colorB: number;
}

export interface BoundingSphereAPIStruct {
  centerId: string;
  radius: number;
}

export enum GeometryModeAPIEnum {
  default,
  loaded,
}

export enum SplineModeAPIEnum {
  unclamped,
  clamped,
}
