import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { HarnessOccurrence } from '../../api/alias';
import { GeometryModeAPIEnum } from '../../api/structs';
import {
  BoxBufferGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  SphereBufferGeometry,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { LoadingService } from '../services/loading.service';
import { SettingsService } from '../services/settings.service';

export class GeometryUtils {
  public static colorGeo(harnessGeo: BufferGeometry, vertexColors: Color[]) {
    if (harnessGeo.attributes['position'].count != vertexColors.length) {
      console.error(
        `vertex count ${harnessGeo.attributes['position'].count} and color array length ${vertexColors.length} must be same`
      );
      return;
    }

    let array: number[] = [];
    vertexColors.forEach((color) => {
      array.push(color.r);
      array.push(color.g);
      array.push(color.b);
    });
    harnessGeo.setAttribute('color', new Float32BufferAttribute(array, 3));
  }

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