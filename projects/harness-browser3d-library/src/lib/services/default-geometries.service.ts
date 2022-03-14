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
  BoxBufferGeometry,
  CylinderBufferGeometry,
  MathUtils,
  SphereBufferGeometry,
} from 'three';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class DefaultGeometryCreationService {
  constructor(private readonly settingsService: SettingsService) {}

  connectorSizes() {
    const connectorSizes = [
      new BoxBufferGeometry(40, 10, 10, 1),
      new BoxBufferGeometry(30, 10, 10, 1),
      new BoxBufferGeometry(20, 10, 10, 1),
    ];
    connectorSizes.forEach((connector) => GeometryUtils.clean(connector));
    return connectorSizes;
  }

  accessory() {
    const accessory = new CylinderBufferGeometry(
      10,
      10,
      20,
      this.settingsService.segmentCount
    ).rotateX(MathUtils.degToRad(90));
    GeometryUtils.clean(accessory);
    return accessory;
  }

  fixing() {
    const fixing = new SphereBufferGeometry(
      10,
      this.settingsService.segmentCount,
      this.settingsService.segmentCount
    );
    GeometryUtils.clean(fixing);
    return fixing;
  }
}
