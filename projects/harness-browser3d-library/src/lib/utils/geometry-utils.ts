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

import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Node, Occurrence } from '../../api/alias';
import { GeometryModeAPIEnum } from '../../api/structs';
import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometry,
  SphereBufferGeometry,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { LoadingService } from '../services/loading.service';
import { SettingsService } from '../services/settings.service';

export class GeometryUtils {
  public static applyGeoAttribute(
    harnessGeo: BufferGeometry,
    name: string,
    bufferAttribute: BufferAttribute
  ): void {
    const attributeSize =
      bufferAttribute.array.length / bufferAttribute.itemSize;
    if (harnessGeo.attributes['position'].count != attributeSize) {
      console.error(
        `vertex count ${harnessGeo.attributes['position'].count} and buffer attribute size ${attributeSize} must be same`
      );
      return;
    }
    harnessGeo.setAttribute(name, bufferAttribute);
  }

  public static mergeGeos(geos: BufferGeometry[]): BufferGeometry {
    const geo = mergeBufferGeometries(geos);
    if (geo) {
      return geo;
    } else {
      console.error('geos could not be merged');
      return new BufferGeometry();
    }
  }

  public static clean(geo: BufferGeometry): BufferGeometry {
    const position = geo.attributes['position'];
    const normal = geo.attributes['normal'];
    //const cleanedGeo = geo.toNonIndexed();
    const cleanedGeo = geo.clone();
    cleanedGeo.attributes = {
      position: position,
      normal: normal,
    };
    GeometryUtils.setParameters(geo, cleanedGeo);
    return cleanedGeo;
  }

  private static setParameters(
    baseGeo: BufferGeometry,
    cleanedGeo: BufferGeometry
  ): void {
    const box = cleanedGeo as BoxBufferGeometry;
    box.parameters = (baseGeo as BoxBufferGeometry).parameters;
    const sphere = cleanedGeo as SphereBufferGeometry;
    sphere.parameters = (baseGeo as SphereBufferGeometry).parameters;
    const tube = cleanedGeo as TubeBufferGeometry;
    tube.parameters = (baseGeo as TubeBufferGeometry).parameters;
  }

  public static createGeo(
    element: Occurrence | Node,
    defaultGeo: BufferGeometry,
    settingsService: SettingsService,
    loadingService: LoadingService
  ): BufferGeometry {
    let loadedGeo =
      'partNumber' in element && element.partNumber
        ? loadingService.getGeometries().get(element.partNumber)
        : undefined;
    if (
      settingsService.geometryMode === GeometryModeAPIEnum.default ||
      loadedGeo === undefined
    ) {
      return defaultGeo.clone();
    } else {
      loadedGeo.bufferGeometry.computeBoundingBox();
      const boundingBox = loadedGeo.bufferGeometry.boundingBox!;
      const geo = new BoxBufferGeometry(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
      );
      geo.applyMatrix4(loadedGeo.offsetMatrix());
      return GeometryUtils.clean(geo);
    }
  }

  public static centerGeometry(geo: BufferGeometry) {
    geo.computeBoundingBox();
    const center = new Vector3();
    geo.boundingBox!.getCenter(center);
    geo.center();
    return center;
  }
}
