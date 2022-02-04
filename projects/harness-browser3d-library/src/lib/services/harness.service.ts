import { GeometryUtils } from '../utils/geometry-utils';
import { GeometryMaterial } from '../structs/material';
import { ElementToVertexMapping, VertexRange } from '../structs/mapping';
import {
  Accessory,
  Connector,
  Fixing,
  Harness,
  Identifiable,
  Protection,
  Segment,
} from '../../api/alias';
import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ColorService } from './color.service';
import { GeometryService } from './geometry.service';
import { SceneService } from './scene.service';
import { SelectionService } from './selection.service';
import { BufferGeometry, Mesh, Scene } from 'three';

@Injectable({
  providedIn: 'root',
})
export class HarnessService {
  private harness?: Harness;

  constructor(
    private readonly cacheService: CacheService,
    private readonly colorService: ColorService,
    private readonly geometryService: GeometryService,
    private readonly sceneService: SceneService,
    private readonly selectionService: SelectionService
  ) {}

  addHarness(harness: Harness) {
    this.harness = harness;
    this.geometryService.harnessElementGeos.clear();

    this.geometryService.processHarness(harness);

    if (!this.cacheService.harnessMeshCache.has(harness.id)) {
      this.setHarnessInElements();
      this.selectionService.setGeos();
      this.addHarnessMesh(
        harness.id,
        this.mergeGeosIntoHarness(),
        this.sceneService.getScene()
      );
      this.colorService.setDefaultColors(harness);
    }

    this.cacheService.harnessCache.set(harness.id, harness);
  }

  private setHarness(identifiable: Identifiable) {
    if (this.harness) {
      this.cacheService.elementHarnessCache.set(identifiable.id, this.harness);
    }
  }

  private setHarnessInElements() {
    if (this.harness) {
      this.harness.segments.forEach((s: Segment) => this.setHarness(s));
      this.harness.protections.forEach((p: Protection) => this.setHarness(p));
      this.harness.fixings.forEach((f: Fixing) => this.setHarness(f));
      this.harness.connectors.forEach((c: Connector) => this.setHarness(c));
      this.harness.accessories.forEach((a: Accessory) => this.setHarness(a));
    }
  }

  private fillMapping() {
    if (this.harness) {
      const mapping = new ElementToVertexMapping();
      this.cacheService.vertexMappings.set(this.harness.id, mapping);
      this.fillMappingHelper(mapping.harnessElementsToVertices);
    }
  }

  /**
   * BufferGeometryUtils.mergeBufferGeometries
   * simply joins all the attributes of the geos in the
   * same order as they have been passed to the function.
   * The mapping is filled according to this information.
   */
  private fillMappingHelper(map: Map<String, VertexRange>) {
    let index = 0;
    for (let entry of this.geometryService.harnessElementGeos.entries()) {
      const id = entry[0];
      const geo = entry[1];
      const newIndex = index + geo.attributes['position'].count;
      map.set(id, new VertexRange(index, newIndex - 1));
      index = newIndex;
    }
  }

  private mergeGeosIntoHarness() {
    const harnessGeos: BufferGeometry[] = [];
    this.geometryService.harnessElementGeos.forEach((geo) =>
      harnessGeos.push(geo)
    );
    const mergedHarnessGeo = GeometryUtils.mergeGeos(harnessGeos);
    this.fillMapping();

    const position = GeometryUtils.centerGeometry(mergedHarnessGeo);
    const mesh = new Mesh(mergedHarnessGeo, GeometryMaterial.harness);
    mesh.position.copy(position);
    return mesh;
  }

  private addHarnessMesh(harnessId: string, mesh: Mesh, scene: Scene) {
    this.cacheService.harnessMeshCache.set(harnessId, mesh);
    scene.add(mesh);
  }
}
