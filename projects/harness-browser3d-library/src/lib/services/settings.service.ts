/*
  Copyright (C) 2024 4Soft GmbH
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as
  published by the Free Software Foundation, either version 2.1 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Lesser Public License for more details.

  You should have received a copy of the GNU General Lesser Public
  License along with this program. If not, see
  http://www.gnu.org/licenses/lgpl-2.1.html.
*/

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Color } from 'three';
import {
  GeometryModeAPIEnum,
  SettingsAPIStruct,
  SplineModeAPIEnum,
} from '../../api/structs';

@Injectable()
export class SettingsService implements SettingsAPIStruct {
  public geometryMode = GeometryModeAPIEnum.default;
  public splineMode = SplineModeAPIEnum.unclamped;
  public pixelRatio = window.devicePixelRatio;
  public enableAntiAliasing = true;
  public segmentCount = 15;
  public curveStepsFactor = 0.1;
  public backgroundColor = new Color(0xcccccc);
  public hoverColor = new Color('white');
  public addHarnessResetCamera = true;
  public zoomPicking = false;
  public zoomSelection = true;
  // cannot be changed after init
  public enablePicking = true;

  public updatedGeometrySettings = new Subject<void>();
  public updatedCameraSettings = new Subject<void>();
  public updatedPickingSettings = new Subject<void>();

  private updatedSettings: string[] = [];

  public set(additionalSettings: SettingsAPIStruct) {
    Object.assign(this, additionalSettings);
    this.updatedSettings = Object.entries(additionalSettings).map(
      (entry) => entry[0],
    );
  }

  public apply() {
    const geoSetting = this.updatedSettings.find(
      (element) =>
        element === 'geometryMode' ||
        element === 'splineMode' ||
        element === 'segmentCount' ||
        element === 'curveStepsFactor',
    );
    const cameraSetting = this.updatedSettings.find(
      (element) =>
        element === 'pixelRatio' ||
        element === 'enableAntiAliasing' ||
        element === 'backgroundColor',
    );
    const pickingSettings = this.updatedSettings.find(
      (element) => element === 'hoverColor' || element === 'zoomPicking',
    );
    if (geoSetting) {
      this.updatedGeometrySettings.next();
    }
    if (cameraSetting) {
      this.updatedCameraSettings.next();
    }
    if (pickingSettings) {
      this.updatedPickingSettings.next();
    }
    this.updatedSettings = [];
  }
}
