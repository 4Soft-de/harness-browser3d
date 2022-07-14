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
import { Color, Float32BufferAttribute, Mesh } from 'three';
import { Harness, Identifiable } from '../../api/alias';
import { SetColorAPIStruct } from '../../api/structs';
import { GeometryColors } from '../structs/colors';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { HarnessUtils } from '../utils/harness-utils';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable()
export class ColorService {
  private readonly key = 'pColor';
  private readonly defaultKey = 'pDefaultColor';

  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public setColors(colors: SetColorAPIStruct[]): void {
    const harness = HarnessUtils.getHarness(
      colors.map((color) => color.harnessElementId),
      this.cacheService
    );
    let mesh = undefined;
    if (harness) {
      mesh = this.cacheService.harnessMeshCache.get(harness.id);
    }
    if (harness && mesh) {
      this.applyColors(harness.id, this.key, this.createMap(colors), mesh);
    } else {
      console.error(ErrorUtils.notFound('harness'));
    }
  }

  public resetColors(harnessId: string) {
    const harness = this.cacheService.harnessCache.get(harnessId);
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    if (harness && mesh) {
      const colors = this.createEmptyColorMap(harness);
      this.applyColors(harnessId, this.key, colors, mesh);
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  public setDefaultColors(harnessId: string) {
    const harness = this.cacheService.harnessCache.get(harnessId);
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    if (harness && mesh) {
      const colors = this.createDefaultColorMap(harness);
      this.applyColors(harnessId, this.defaultKey, colors, mesh);
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  private applyColors(
    harnessId: string,
    key: string,
    colors: Map<string, Color>,
    mesh: Mesh
  ) {
    const array: number[] = [];
    this.mappingService
      .applyMapping(harnessId, GeometryColors.empty, colors)
      .forEach((color) => array.push(color.r, color.g, color.b));
    GeometryUtils.applyGeoAttribute(
      mesh.geometry,
      key,
      new Float32BufferAttribute(array, 3)
    );
  }

  private createMap(array: SetColorAPIStruct[]): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    array.forEach((struct) => map.set(struct.harnessElementId, struct.color));
    return map;
  }

  private createEmptyColorMap(harness: Harness): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    const add = (identifiable: Identifiable) => {
      map.set(identifiable.id, GeometryColors.empty);
    };
    harness.segments.forEach(add);
    harness.protections.forEach(add);
    harness.fixings.forEach(add);
    harness.connectors.forEach(add);
    harness.accessories.forEach(add);
    return map;
  }

  private createDefaultColorMap(harness: Harness): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    harness.segments.forEach((segment) =>
      map.set(segment.id, GeometryColors.segment)
    );
    harness.protections.forEach((protection) =>
      map.set(protection.id, GeometryColors.protection)
    );
    harness.fixings.forEach((fixing) =>
      map.set(fixing.id, GeometryColors.fixing)
    );
    harness.connectors.forEach((connector) =>
      map.set(connector.id, GeometryColors.connector)
    );
    harness.accessories.forEach((accessory) =>
      map.set(accessory.id, GeometryColors.accessory)
    );
    return map;
  }
}
