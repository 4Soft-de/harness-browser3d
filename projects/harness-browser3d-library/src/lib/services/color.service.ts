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
import { SetColorAPIStruct } from '../../api/structs';
import { GeometryColors } from '../structs/colors';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
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

  public setColors(struct: SetColorAPIStruct): void {
    const mesh = this.cacheService.harnessMeshCache.get(struct.harnessId);
    if (mesh) {
      this.applyColors(
        struct.harnessId,
        this.key,
        this.createMap(struct),
        mesh
      );
    } else {
      console.error(ErrorUtils.notFound(struct.harnessId));
    }
  }

  public resetColors() {
    this.cacheService.harnessMeshCache.forEach((mesh, harnessId) => {
      const colors = this.createEmptyColorMap(harnessId);
      this.applyColors(harnessId, this.key, colors, mesh);
    });
  }

  public setDefaultColors(harnessId: string) {
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    if (mesh) {
      const colors = this.createDefaultColorMap(harnessId);
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

  private createMap(struct: SetColorAPIStruct): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    struct.colors.forEach((entry) =>
      map.set(entry.harnessElementId, entry.color)
    );
    return map;
  }

  private createEmptyColorMap(harnessId: string): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    const add = (identifiable: any) => {
      if ('id' in identifiable) {
        map.set(identifiable.id, GeometryColors.empty);
      }
    };
    const harness = this.cacheService.harnessCache.get(harnessId);
    if (harness) {
      harness.nodes.forEach(add);
      harness.segments.forEach(add);
      harness.occurrences.forEach(add);
    } else {
      console.log(ErrorUtils.notFound(harnessId));
    }
    return map;
  }

  private createDefaultColorMap(harnessId: string): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    const harness = this.cacheService.harnessCache.get(harnessId);
    if (harness) {
      harness.nodes.forEach((node) => map.set(node.id, GeometryColors.node));
      harness.segments.forEach((segment) =>
        map.set(segment.id, GeometryColors.segment)
      );
      harness.occurrences.forEach((occurrence) =>
        map.set(occurrence.id, GeometryColors.getColor(occurrence.partType))
      );
    } else {
      console.log(ErrorUtils.notFound(harnessId));
    }
    return map;
  }
}
