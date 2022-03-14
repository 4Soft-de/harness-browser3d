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
import { Color } from 'three';
import {
  Accessory,
  Connector,
  Fixing,
  Harness,
  Protection,
  Segment,
} from '../../api/alias';
import { SetColorAPIStruct } from '../../api/structs';
import { GeometryColors } from '../structs/colors';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { HarnessUtils } from '../utils/harness-utils';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(private readonly cacheService: CacheService) {}

  public setColors(input: SetColorAPIStruct[]) {
    const harness = HarnessUtils.getHarness(
      input.map((color) => color.id),
      this.cacheService
    );
    if (harness) {
      const colors: Map<string, Color> = new Map();
      this.initColors(harness, colors);
      this.convertInput(input, colors);
      this.applyColors(harness, colors);
    } else if (input.length) {
      console.warn(ErrorUtils.notFound('harness'));
    }
  }

  public setDefaultColors(harness: Harness) {
    const colors: Map<string, Color> = new Map();
    this.initColors(harness, colors);
    this.applyColors(harness, colors);
  }

  private conversion(value: number) {
    return value / 255;
  }

  private initColors(harness: Harness, colors: Map<string, Color>) {
    harness.segments.forEach((s: Segment) =>
      colors.set(s.id, GeometryColors.segment)
    );
    harness.protections.forEach((p: Protection) =>
      colors.set(p.id, GeometryColors.protection)
    );
    harness.fixings.forEach((f: Fixing) =>
      colors.set(f.id, GeometryColors.fixing)
    );
    harness.connectors.forEach((c: Connector) =>
      colors.set(c.id, GeometryColors.connector)
    );
    harness.accessories.forEach((a: Accessory) =>
      colors.set(a.id, GeometryColors.accessory)
    );
  }

  private convertInput(input: SetColorAPIStruct[], colors: Map<string, Color>) {
    input.forEach((color) => {
      const value = new Color(
        this.conversion(color.colorR),
        this.conversion(color.colorG),
        this.conversion(color.colorB)
      );
      colors.set(color.id, value);
    });
  }

  private applyColors(harness: Harness, colors: Map<string, Color>) {
    const mapping = this.cacheService.vertexMappings.get(harness.id);
    const harnessMesh = this.cacheService.harnessMeshCache.get(harness.id);

    if (harnessMesh && mapping) {
      const arrays = mapping.apply(
        harnessMesh.geometry,
        GeometryColors.notFound,
        colors
      );
      GeometryUtils.colorGeo(harnessMesh.geometry, arrays);
    } else {
      console.error(ErrorUtils.notFound('harnessMesh or mapping'));
    }
  }
}
