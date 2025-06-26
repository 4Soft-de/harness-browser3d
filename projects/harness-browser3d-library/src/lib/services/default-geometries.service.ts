/*
  Copyright (C) 2025 4Soft GmbH
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
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  MathUtils,
  SphereGeometry,
} from 'three';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable()
export class DefaultGeometryCreationService {
  constructor(private readonly settingsService: SettingsService) {}

  get node(): BufferGeometry {
    const node = new SphereGeometry(
      4,
      this.settingsService.segmentCount,
      this.settingsService.segmentCount,
    );
    GeometryUtils.clean(node);
    return node;
  }

  get connectorSizes(): BufferGeometry[] {
    const connectorSizes = [
      new BoxGeometry(40, 10, 10, 1),
      new BoxGeometry(30, 10, 10, 1),
      new BoxGeometry(20, 10, 10, 1),
    ];
    connectorSizes.forEach(GeometryUtils.clean);
    return connectorSizes;
  }

  get accessory(): BufferGeometry {
    const accessory = new CylinderGeometry(
      10,
      10,
      20,
      this.settingsService.segmentCount,
    ).rotateX(MathUtils.degToRad(90));
    GeometryUtils.clean(accessory);
    return accessory;
  }

  get fixing(): BufferGeometry {
    const fixing = new SphereGeometry(
      10,
      this.settingsService.segmentCount,
      this.settingsService.segmentCount,
    );
    GeometryUtils.clean(fixing);
    return fixing;
  }
}
