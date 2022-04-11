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
import { HarnessOccurrence } from '../../api/alias';
import { GeometryModeAPIEnum } from '../../api/structs';
import {
  BoxBufferGeometry,
  BufferGeometry,
  SphereBufferGeometry,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { LoadingService } from '../services/loading.service';
import { SettingsService } from '../services/settings.service';

export class GeometryUtils {
  public static mergeGeos(geos: BufferGeometry[]) {
    const geo = mergeBufferGeometries(geos);
    if (geo) {
      return geo;
    } else {
      console.error('geos could not be merged');
      return new BufferGeometry();
    }
  }

  public static clean(geo: BufferGeometry) {
    const baseGeo = geo.toNonIndexed();
    baseGeo.deleteAttribute('uv');
    const boxGeo = baseGeo as BoxBufferGeometry;
    boxGeo.parameters = (geo as BoxBufferGeometry).parameters;
    const sphere = baseGeo as SphereBufferGeometry;
    sphere.parameters = (geo as SphereBufferGeometry).parameters;
    const tube = baseGeo as TubeBufferGeometry;
    tube.parameters = (geo as TubeBufferGeometry).parameters;
    return baseGeo;
  }

  public static createGeo(
    element: HarnessOccurrence,
    defaultGeo: BufferGeometry,
    settingsService: SettingsService,
    loadingService: LoadingService
  ) {
    let loadedGeo = undefined;
    loadedGeo = loadingService.getGeometries().get(element.partNumber);
    let geo: BufferGeometry;
    if (
      settingsService.geometryMode === GeometryModeAPIEnum.default ||
      loadedGeo === undefined
    ) {
      geo = defaultGeo.clone();
    } else {
      loadedGeo.bufferGeometry.computeBoundingBox();
      const boundingBox = loadedGeo.bufferGeometry.boundingBox!;
      geo = new BoxBufferGeometry(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
      );
      GeometryUtils.clean(geo);
      geo.applyMatrix4(loadedGeo.offsetMatrix());
    }
    return geo;
  }

  public static centerGeometry(geo: BufferGeometry) {
    geo.computeBoundingBox();
    const center = new Vector3();
    geo.boundingBox!.getCenter(center);
    geo.center();
    return center;
  }
}
