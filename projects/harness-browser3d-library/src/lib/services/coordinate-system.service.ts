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
import {
  AxesHelper,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';
import { CameraService } from './camera.service';

@Injectable({
  providedIn: 'root',
})
export class CoordinateSystemService {
  private axesHelper: AxesHelper;
  private axesScene: Scene;
  private axesCamera: PerspectiveCamera;

  constructor(private readonly cameraService: CameraService) {
    const mainCamera = this.cameraService.getCamera();
    const size = new Vector3(1, 0, 0)
      .unproject(mainCamera)
      .sub(new Vector3(-1, 0, 0).unproject(mainCamera))
      .length();

    this.axesHelper = new AxesHelper(size);
    this.axesScene = new Scene();
    this.axesScene.add(this.axesHelper);
    this.axesCamera = new PerspectiveCamera(50, 1, 0.1, 1 + size);
  }

  render(renderer: WebGLRenderer) {
    const oldViewport = renderer.getViewport(new Vector4());
    const oldScissor = renderer.getScissor(new Vector4());

    const size = renderer.getSize(new Vector2()).x * 0.1;
    const dimension = new Vector4(0, 0, size, size);
    renderer.setViewport(dimension);
    renderer.setScissor(dimension);

    renderer.setScissorTest(true);
    renderer.render(this.axesScene, this.axesCamera);
    renderer.setScissorTest(false);

    renderer.setViewport(oldViewport);
    renderer.setScissor(oldScissor);
  }

  animate(target: Vector3) {
    const mainCamera = this.cameraService.getCamera();
    this.axesCamera.rotation.copy(mainCamera.rotation);
    const position = mainCamera.position.clone().sub(target).normalize();
    this.axesCamera.position.copy(position);
    this.axesCamera.updateMatrixWorld();
  }
}
