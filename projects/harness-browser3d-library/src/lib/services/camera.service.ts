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
import { Point } from '../../api/alias';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CacheService } from './cache.service';
import { ErrorUtils } from '../utils/error-utils';
import { isPlacedHarnessOccurrence } from '../utils/cast';
import { MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private cameraSettings = {
    resetCameraDistance: 1000,
    resetCameraAngle: 45,
    resetCameraHeightFactor: 1.2,

    zoomOnMeshDistance: 100,
    zoomOnMeshAngle: 0,
    zoomOnMeshHeightFactor: 1,
  };

  private camera: PerspectiveCamera;
  private controls?: OrbitControls;

  constructor(private cacheService: CacheService) {
    this.camera = new PerspectiveCamera(70, 1, 0.1, 10000);
    this.camera.up.set(0, 0, 1);
    this.camera.updateProjectionMatrix();
  }

  initControls(canvas: HTMLCanvasElement) {
    this.controls = new OrbitControls(this.camera, canvas);
  }

  public getCamera() {
    return this.camera;
  }

  public getControls() {
    return this.controls;
  }

  private computeMinMaxOfLoadedElements(): {
    min: Vector3;
    max: Vector3;
  } {
    const min: Vector3 = new Vector3(Infinity, Infinity, Infinity);
    const max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity);

    for (const element of this.cacheService.elementCache.values()) {
      let meshPos: Point | undefined = undefined;
      let harnessId: string | undefined = undefined;
      if (isPlacedHarnessOccurrence(element) && element.placement) {
        meshPos = element.placement.location;
      }
      const harness = this.cacheService.elementHarnessCache.get(element.id);
      harnessId = harness?.id;

      if (meshPos && harnessId) {
        max.x = meshPos.x > max.x ? meshPos.x : max.x;
        max.y = meshPos.y > max.y ? meshPos.y : max.y;
        max.z = meshPos.z > max.z ? meshPos.z : max.z;

        min.x = meshPos.x < min.x ? meshPos.x : min.x;
        min.y = meshPos.y < min.y ? meshPos.y : min.y;
        min.z = meshPos.z < min.z ? meshPos.z : min.z;
      }
    }

    return { min, max };
  }

  private computeMidOfLoadedElements(min: Vector3, max: Vector3): Vector3 {
    const result: Vector3 = new Vector3(0, 0, 0);
    return result.addVectors(min, result.subVectors(max, min).divideScalar(2));
  }

  public resetCamera() {
    if (this.cacheService.elementCache.size > 0) {
      const minMax = this.computeMinMaxOfLoadedElements();
      const mid: Vector3 = this.computeMidOfLoadedElements(
        minMax.min,
        minMax.max
      );
      this.focusCameraOnPosition(minMax.min, minMax.max, mid);
    } else {
      this.focusCameraOnPosition(
        new Vector3(-0.5, -0.5, -0.5),
        new Vector3(0.5, 0.5, 0.5),
        new Vector3(0, 0, 0)
      );
    }
  }

  public focusCameraOnMesh(mesh: Mesh) {
    if (mesh.geometry.boundingBox) {
      const minMaxMid = this.computeMinMaxMidOfMesh(mesh);
      this.focusCameraOnPosition(minMaxMid.min, minMaxMid.max, minMaxMid.mid);
    } else {
      console.error('no bounding box computed');
    }
  }

  private computeMinMaxMidOfMesh(mesh: Mesh): {
    min: Vector3;
    max: Vector3;
    mid: Vector3;
  } {
    const mid = mesh.position;

    const halveSize = new Vector3();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.boundingBox!.getSize(halveSize);
    halveSize.divideScalar(2);

    const min = mid.clone().sub(halveSize);
    const max = mid.clone().add(halveSize);

    return { min, max, mid };
  }

  private focusCameraOnPosition(min: Vector3, max: Vector3, mid: Vector3) {
    if (!this.controls) {
      console.error(ErrorUtils.isUndefined('controls'));
      return;
    }

    const vecMinMax = new Vector3().subVectors(min, max);
    const initCamDir = vecMinMax.clone();
    initCamDir
      .crossVectors(initCamDir, this.camera.up)
      .normalize()
      .applyAxisAngle(
        this.camera.up,
        MathUtils.degToRad(-this.cameraSettings.resetCameraAngle)
      );
    this.camera.position.subVectors(mid, initCamDir);
    this.controls.target.copy(mid);
    this.controls.update();
    this.camera.updateMatrixWorld();

    const leftViewPos = new Vector3(-1, 0, 0).unproject(this.camera);
    const leftViewDir = this.camera.position
      .clone()
      .sub(leftViewPos)
      .normalize();

    this.camera.position
      .addVectors(
        min,
        leftViewDir.multiplyScalar(this.cameraSettings.resetCameraDistance)
      )
      .set(
        this.camera.position.x,
        this.camera.position.y,
        max.z * this.cameraSettings.resetCameraHeightFactor
      );

    this.camera.updateMatrixWorld();
    this.controls.update();
  }
}
