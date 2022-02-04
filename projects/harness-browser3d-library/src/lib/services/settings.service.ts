import { Injectable } from '@angular/core';
import {
  GeometryModeAPIEnum,
  SettingsAPIStruct,
  SplineModeAPIEnum,
} from '../../api/structs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public geometryMode = GeometryModeAPIEnum.default;
  public splineMode = SplineModeAPIEnum.unclamped;
  public pixelRatio = window.devicePixelRatio;
  public segmentCount = 15;
  public curveStepsFactor = 0.1;

  constructor() {}

  public add(additionalSettings: SettingsAPIStruct) {
    Object.assign(this, additionalSettings);
  }
}
