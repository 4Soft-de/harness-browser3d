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

import { BufferGeometry } from 'three';

export class ElementToVertexMapping {
  public readonly harnessElementsToVertices: Map<string, VertexRange> =
    new Map();

  private initializeMap(size: number, blankValue: any) {
    const map: Map<number, any> = new Map();
    for (let i = 0; i < size; i++) {
      map.set(i, blankValue);
    }
    return map;
  }

  private mapToArray(map: Map<number, any>) {
    const array: any[] = [];
    map.forEach((value) => array.push(value));
    return array;
  }

  /**
   * converts map into attribute array
   */
  public apply(
    geo: BufferGeometry,
    defaultValue: any,
    values: Map<string, any>
  ) {
    const map = this.initializeMap(
      geo.attributes['position'].count,
      defaultValue
    );
    for (const entry of this.harnessElementsToVertices) {
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
}

export class VertexRange {
  constructor(public readonly high: number, public readonly low: number) {}

  public toArray() {
    const array: number[] = [];
    for (let i = this.high; i <= this.low; i++) {
      array.push(i);
    }
    return array;
  }
}
