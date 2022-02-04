import { Injectable } from '@angular/core';
import { BufferGeometry, Mesh, Scene } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Graphics } from '../../api/alias';
import { LoadedGeometry } from '../structs/loaded-geometries';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly geometries: Map<string, LoadedGeometry> = new Map();

  constructor() {}

  public getGeometries() {
    return this.geometries;
  }

  public parseGeometryData(geometries: Graphics[]) {
    if (process.env['NODE_ENV'] !== 'production') {
      import('three/examples/jsm/loaders/VRMLLoader').then((module) => {
        let emptyIterator = true;

        for (const passedGeometry of geometries.values()) {
          emptyIterator = false;
          if (this.geometries.has(passedGeometry.partNumber)) {
            continue;
          }

          const vrmloader = new module.VRMLLoader();
          let loaded;
          try {
            loaded = vrmloader.parse(passedGeometry.data, '');
          } catch (e) {
            console.error(`exception during VRML loading\n\n${e}`);
            return;
          }

          const geos: BufferGeometry[] = this.traverseLoadedData(loaded);
          if (geos.length > 0) {
            const geo = mergeBufferGeometries(geos, false);
            geo.scale(1, 1, 1);
            geo.name = passedGeometry.partNumber;
            this.geometries.set(
              passedGeometry.partNumber,
              new LoadedGeometry(geo)
            );
          }
        }

        if (emptyIterator) {
          console.info('no geometries to parse');
        }
      });
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

  private filterAttributes(geo: BufferGeometry) {
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
    return null;
  }
}
