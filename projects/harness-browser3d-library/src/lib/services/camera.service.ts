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

@Injectable()
export class CameraService {
  private cameraSettings = {
    resetCameraDistanceFactor: 1.15,
    selectionDistanceFactor: 1.5,
  };

  private camera: PerspectiveCamera;
  private controls?: OrbitControls;

  constructor(private readonly cacheService: CacheService) {
    this.camera = new PerspectiveCamera(70, 1, 0.1, 10000);
    this.camera.up.set(0, 0, 1);
    this.camera.updateProjectionMatrix();
  }

  public initControls(canvas: HTMLCanvasElement) {
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.listenToKeyEvents(canvas);
  }

  public getCamera() {
    return this.camera;
  }

  public getControls() {
    return this.controls;
  }

  public resetCamera() {
    const mesh = this.cacheService.getBordnetMesh();
    if (mesh) {
      this.focusCameraOnMesh(mesh);
    }
  }

  public focusCameraOnMesh(mesh: Mesh) {
    if (mesh.geometry.boundingBox) {
      const sphere = this.computeBoundingSphere(mesh);
      this.focusCameraOnSphere(
        sphere,
        this.cameraSettings.selectionDistanceFactor
      );
    } else {
      console.error('no bounding box computed');
    }
  }

  private computeBoundingSphere(mesh: Mesh) {
    return new Box3().setFromObject(mesh).getBoundingSphere(new Sphere());
  }

  private focusCameraOnSphere(sphere: Sphere, distanceFactor: number) {
    if (!this.controls) {
      console.error(ErrorUtils.isUndefined('controls'));
      return;
    }

    const leftSpherePos = new Vector3(1, 0, 0)
      .multiplyScalar(sphere.radius)
      .sub(sphere.center)
      .multiplyScalar(-1);

    const leftSphereDir =
      this.computeLeftSideCameraDirection(sphere).add(leftSpherePos);

    const centerSphereDir = new Vector3().addVectors(
      sphere.center,
      new Vector3(0, 1, 0)
    );

    const intersection = this.computeIntersection(
      leftSpherePos,
      leftSphereDir,
      sphere.center,
      centerSphereDir
    );

    const additionalDistance = intersection.y * distanceFactor - intersection.y;

    this.camera.position.addVectors(
      intersection,
      new Vector3(0, additionalDistance, 0)
    );
    this.controls.target.copy(sphere.center);
    this.controls.update();
    this.camera.updateMatrixWorld();
  }

  private computeLeftSideCameraDirection(sphere: Sphere) {
    this.camera.position.copy(new Vector3(0, 1, 0).add(sphere.center));
    this.camera.lookAt(sphere.center);
    this.camera.updateMatrixWorld();

    return new Vector3().subVectors(
      this.camera.position,
      new Vector3(-1, 0, 0).unproject(this.camera)
    );
  }

  // see https://de.wikipedia.org/wiki/Schnittpunkt
  private computeIntersection(
    beginA: Vector3,
    endA: Vector3,
    beginB: Vector3,
    endB: Vector3
  ) {
    const A = beginB.x * endB.y - beginB.y * endB.x;
    const B = beginA.x * endA.y - beginA.y * endA.x;

    const a = endA.x - beginA.x;
    const b = endB.x - beginB.x;
    const c = endA.y - beginA.y;
    const d = endB.y - beginB.y;

    const x = a * A - b * B;
    const y = c * A - d * B;
    const s = a * d - c * b;

    return new Vector3(x, y, 0).divideScalar(s).setZ(beginA.z);
  }
}
