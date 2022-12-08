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
import { VertexRange } from '../structs/range';
import { BordnetMeshService } from './bordnet-mesh.service';

@Injectable()
export class MappingService {
  private mappingsCache = new Map<string, VertexRange>();

  constructor(private readonly bordnetMeshService: BordnetMeshService) {}

  /**
   * converts map into attribute array
   */
  public applyMapping<PROPERTY>(
    defaultValue: PROPERTY,
    values: Map<string, PROPERTY>
  ): PROPERTY[] {
    const map = this.initializeMap(defaultValue);
    values.forEach((value, key) => {
      const range = this.mappingsCache.get(key);
      range?.toArray().forEach((vertex) => {
        if (value !== undefined) {
          map.set(vertex, value);
        }
      });
    });
    return this.mapToArray(map);
  }

  private initializeMap<PROPERTY>(
    defaultValue: PROPERTY
  ): Map<number, PROPERTY> {
    const size = this.bordnetMeshService.getVerticesCount();
    const map: Map<number, PROPERTY> = new Map();
    for (let i = 0; i < size; i++) {
      map.set(i, defaultValue);
    }
    return map;
  }

  private mapToArray<PROPERTY>(map: Map<number, PROPERTY>): PROPERTY[] {
    const array: PROPERTY[] = [];
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
    harnessElementGeos: BufferGeometry[]
  ): void {
    let index = this.bordnetMeshService.getVerticesCount();
    harnessElementGeos.forEach((geo) => {
      const newIndex = index + geo.attributes['position'].count;
      this.mappingsCache.set(geo.name, new VertexRange(index, newIndex - 1));
      index = newIndex;
    });
  }

  public clear() {
    this.mappingsCache.clear();
  }
}
