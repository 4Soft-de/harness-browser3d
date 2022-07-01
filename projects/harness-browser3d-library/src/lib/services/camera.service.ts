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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CacheService } from './cache.service';
import { ErrorUtils } from '../utils/error-utils';
import { Box3, Mesh, PerspectiveCamera, Sphere, Vector3 } from 'three';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private cameraSettings = {
    resetCameraDistanceFactor: 1.15,
    resetCameraAngle: 45,
    resetCameraHeightFactor: 1.2,
  };

  private camera: PerspectiveCamera;
  private controls?: OrbitControls;

  constructor(private cacheService: CacheService) {
    this.camera = new PerspectiveCamera(70, 1, 0.1, 10000);
    this.camera.up.set(0, 0, 1);
    this.camera.updateProjectionMatrix();
  }

  public initControls(canvas: HTMLCanvasElement) {
    this.controls = new OrbitControls(this.camera, canvas);
  }

  public getCamera() {
    return this.camera;
  }

  public getControls() {
    return this.controls;
  }

  public resetCamera() {
    if (this.cacheService.harnessMeshCache.size) {
      const sphere = this.computeSceneBoundingSphere();
      this.focusCameraOnSphere(sphere);
    } else {
      this.focusCameraOnSphere(new Sphere(new Vector3(0, 0, 0), 1));
    }
  }

  public focusCameraOnMesh(mesh: Mesh) {
    if (mesh.geometry.boundingBox) {
      const sphere = this.computeBoundingSphere(mesh);
      this.focusCameraOnSphere(sphere);
    } else {
      console.error('no bounding box computed');
    }
  }

  private computeSceneBoundingSphere() {
    const boxes: Box3[] = [];
    this.cacheService.harnessMeshCache.forEach((mesh) =>
      boxes.push(new Box3().setFromObject(mesh))
    );
    const vectors = boxes.flatMap((box) => [box.min, box.max]);
    return new Sphere().setFromPoints(vectors);
  }

  private computeBoundingSphere(mesh: Mesh) {
    return new Box3().setFromObject(mesh).getBoundingSphere(new Sphere());
  }

  private focusCameraOnSphere(sphere: Sphere) {
    if (!this.controls) {
      console.error(ErrorUtils.isUndefined('controls'));
      return;
    }

    const camPos = sphere.center
      .clone()
      .sub(new Vector3(0, sphere.radius, 0))
      .multiplyScalar(this.cameraSettings.resetCameraDistanceFactor);

    this.camera.position.copy(camPos);
    this.controls.target.copy(sphere.center);

    this.camera.updateMatrixWorld();
    this.controls.update();
  }
}
