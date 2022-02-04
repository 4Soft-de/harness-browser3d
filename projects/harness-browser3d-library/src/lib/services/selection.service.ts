import { Injectable } from '@angular/core';
import { PlacedHarnessOccurrence } from '../../api/alias';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeometryMaterial } from '../structs/material';
import { ErrorUtils } from '../utils/error-utils';
import { CameraService } from './camera.service';
import { SceneService } from './scene.service';
import { GeometryService } from './geometry.service';
import { GeometryUtils } from '../utils/geometry-utils';
import { BufferGeometry, Mesh, Scene, SphereBufferGeometry } from 'three';

class BoundingSphere {
  constructor(
    private scene: Scene,
    private outer: Mesh,
    private inner: Mesh,
    private center: Mesh
  ) {}

  public add() {
    this.scene.add(this.outer, this.inner, this.center);
  }

  public remove() {
    this.scene.remove(this.outer, this.inner, this.center);
  }
}

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private selectMesh: Mesh | undefined;
  private selectSphere: BoundingSphere | undefined;
  private readonly harnessElementGeos: Map<string, BufferGeometry> = new Map();

  constructor(
    private readonly cameraService: CameraService,
    private readonly geometryService: GeometryService,
    private readonly sceneService: SceneService
  ) {}

  public setGeos() {
    for (const entry of this.geometryService.harnessElementGeos) {
      this.harnessElementGeos.set(entry[0], entry[1]);
    }
  }

  public clearGeos() {
    this.harnessElementGeos.clear();
  }

  public selectElements(ids: string[]) {
    this.resetMesh();
    this.resetSphere();

    const selectedObjects: BufferGeometry[] = [];
    ids.forEach((id) => {
      const cacheElem = this.harnessElementGeos.get(id);
      if (cacheElem) {
        selectedObjects.push(cacheElem);
      } else {
        console.warn(ErrorUtils.notFound(id));
      }
    });
    if (selectedObjects.length > 0) {
      const selectGeo = mergeBufferGeometries(selectedObjects);
      this.selectMesh = new Mesh(selectGeo, GeometryMaterial.selection);
      const selectCenter = GeometryUtils.centerGeometry(selectGeo);
      this.selectMesh.position.copy(selectCenter);
      this.sceneService.getScene().add(this.selectMesh);

      this.cameraService.focusCameraOnMesh(this.selectMesh);
    }
  }

  public drawBoundingSphere(
    centerElement: PlacedHarnessOccurrence,
    radius: number
  ) {
    let resolution = radius * 0.1;

    if (!centerElement.placement || !centerElement.placement.location) {
      console.warn(ErrorUtils.notPlaced(centerElement));
      return;
    }
    let center = centerElement.placement.location;

    let centerGeo = this.harnessElementGeos.get(centerElement.id);
    if (!centerGeo) {
      console.warn(ErrorUtils.notFound(centerElement.id));
      return;
    }
    let centerMesh = new Mesh(centerGeo, GeometryMaterial.boundingSphereCenter);

    let sphere = new SphereBufferGeometry(radius, resolution, resolution);
    let outerMesh = new Mesh(sphere, GeometryMaterial.boundingSphereOuter);
    let innerMesh = new Mesh(sphere, GeometryMaterial.boundingSphereInner);

    outerMesh.position.set(center.x, center.y, center.z);
    innerMesh.position.set(center.x, center.y, center.z);

    this.selectSphere = new BoundingSphere(
      this.sceneService.getScene(),
      outerMesh,
      innerMesh,
      centerMesh
    );
    this.selectSphere.add();
  }

  public resetMesh() {
    if (this.selectMesh) {
      this.sceneService.getScene().remove(this.selectMesh);
      this.selectMesh = undefined;
    }
  }

  public resetSphere() {
    if (this.selectSphere) {
      this.selectSphere.remove();
      this.selectSphere = undefined;
    }
  }
}
