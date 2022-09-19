/*
  Copyright (C) 2022 4Soft GmbH
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
import {
  BufferGeometry,
  Curve,
  Matrix4,
  Quaternion,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable()
export class PositionService {
  constructor(private readonly settingsService: SettingsService) {}

  public positionGeometry(
    position: Vector3,
    rotation: Quaternion,
    geo: BufferGeometry
  ): void {
    const matrix = new Matrix4().compose(
      position,
      rotation,
      new Vector3(1, 1, 1)
    );
    geo.applyMatrix4(matrix);
  }

  public positionTubeGeometry(
    curve: Curve<Vector3>,
    length: number,
    radius: number
  ): BufferGeometry | undefined {
    if (length <= 0 || radius <= 0) {
      return undefined;
    }
    const geo = new TubeBufferGeometry(
      curve,
      Math.ceil(length * this.settingsService.curveStepsFactor),
      radius,
      this.settingsService.segmentCount,
      false
    );
    GeometryUtils.clean(geo);
    return geo;
  }
}
