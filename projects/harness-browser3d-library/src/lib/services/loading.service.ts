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
import { BufferGeometry, Mesh, Scene } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { Graphic } from '../../api/alias';
import { LoadedGeometry } from '../structs/loaded-geometries';
import { GeometryUtils } from '../utils/geometry-utils';

@Injectable()
export class LoadingService {
  private readonly geometries: Map<string, LoadedGeometry> = new Map();

  constructor() {}

  public getGeometries(): Map<string, LoadedGeometry> {
    return this.geometries;
  }

  public clear(): void {
    this.geometries.clear();
  }

  public parseGeometryData(graphics: Graphic[]): void {
    let emptyIterator = true;

    graphics.forEach((graphic) => {
      emptyIterator = false;
      if (this.geometries.has(graphic.partNumber)) {
        return;
      }

      const vrmloader = new VRMLLoader();
      let loaded;
      try {
        loaded = vrmloader.parse(graphic.data, '');
      } catch (e) {
        console.error(
          `exception during VRML loading for part number ${graphic.partNumber}\n\n${e}`
        );
        return;
      }

      const geos: BufferGeometry[] = this.traverseLoadedData(loaded);
      if (geos.length > 0) {
        const geo = mergeVertices(GeometryUtils.mergeGeos(geos));
        geo.name = graphic.partNumber;
        const loadedGeo = new LoadedGeometry(geo);
        geo.applyMatrix4(loadedGeo.offsetMatrix());
        this.geometries.set(graphic.partNumber, loadedGeo);
      }
    });

    if (emptyIterator) {
      console.info('no geometries to parse');
    }
  }

  private traverseLoadedData(loaded: Scene): BufferGeometry[] {
    const geos: BufferGeometry[] = [];
    loaded.traverse((mesh) => {
      if (mesh instanceof Mesh && mesh.geometry instanceof BufferGeometry) {
        const geo = this.filterAttributes(mesh.geometry);
        if (geo) {
          geos.push(geo);
        }
      }
    });
    return geos;
  }

  private filterAttributes(geo: BufferGeometry): BufferGeometry | undefined {
    const copy = new BufferGeometry();
    const loadedPosition = geo.getAttribute('position');
    const loadedNormal = geo.getAttribute('normal');
    const loadedUV = geo.getAttribute('uv');
    const index = geo.index;
    if (
      loadedPosition !== undefined &&
      loadedNormal !== undefined &&
      loadedUV === undefined &&
      index === null
    ) {
      copy.setAttribute('position', loadedPosition);
      copy.setAttribute('normal', loadedNormal);
      return copy;
    }
    return undefined;
  }
}
