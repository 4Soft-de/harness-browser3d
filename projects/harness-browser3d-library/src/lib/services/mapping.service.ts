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
import { BufferGeometry } from 'three';
import { Harness } from '../../api/alias';
import { HarnessElementVertexMappings, VertexRange } from '../structs/range';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root',
})
export class MappingService {
  private readonly harnessMappings: Map<string, HarnessElementVertexMappings> =
    new Map();

  constructor(private readonly cacheService: CacheService) {}

  public getHarnessMapping(harness: Harness) {
    return this.harnessMappings.get(harness.id);
  }

  /**
   * converts map into attribute array
   */
  public applyMapping(
    harnessId: string,
    defaultValue: any,
    values: Map<string, any>
  ) {
    const harnessMesh = this.cacheService.harnessMeshCache.get(harnessId);
    const harnessMapping = this.harnessMappings.get(harnessId);
    if (harnessMesh && harnessMapping) {
      const harnessGeo = harnessMesh.geometry;
      const map = this.initializeMap(harnessGeo, defaultValue);
      for (const entry of harnessMapping.harnessElementsToVertices) {
        const id = entry[0];
        const range = entry[1];
        range.toArray().forEach((vertex) => {
          const value = values.get(id);
          if (value) {
            map.set(vertex, value);
          }
        });
      }
      return this.mapToArray(map);
    }
    return [];
  }

  private initializeMap(geo: BufferGeometry, defaultValue: any) {
    const size = geo.attributes['position'].count;
    const map: Map<number, any> = new Map();
    for (let i = 0; i < size; i++) {
      map.set(i, defaultValue);
    }
    return map;
  }

  private mapToArray(map: Map<number, any>) {
    const array: any[] = [];
    map.forEach((value) => array.push(value));
    return array;
  }

  /**
   * BufferGeometryUtils.mergeBufferGeometries
   * simply joins all the attributes of the geos in the
   * same order as they have been passed to the function.
   * The mapping is filled according to this information.
   */
  public addHarnessElementVertexMappings(
    harness: Harness,
    harnessElementGeos: Map<string, BufferGeometry>
  ) {
    const mapping = new HarnessElementVertexMappings();
    this.harnessMappings.set(harness.id, mapping);
    let index = 0;
    for (let entry of harnessElementGeos) {
      const id = entry[0];
      const geo = entry[1];
      const newIndex = index + geo.attributes['position'].count;
      mapping.harnessElementsToVertices.set(
        id,
        new VertexRange(index, newIndex - 1)
      );
      index = newIndex;
    }
  }
}
