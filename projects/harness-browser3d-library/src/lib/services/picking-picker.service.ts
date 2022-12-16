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

import { Injectable, OnDestroy } from '@angular/core';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
  NoBlending,
  Scene,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { dispose } from '../utils/dispose-utils';
import { CameraService } from './camera.service';

@Injectable()
export class PickingPickerService implements OnDestroy {
  private readonly scene = new Scene();
  private meshes: Mesh[] = [];
  private readonly renderer = new WebGLRenderer({ alpha: true });
  private readonly renderTarget = new WebGLRenderTarget(1, 1);
  private readonly pixelBuffer = new Uint8Array(4);

  constructor(private readonly cameraService: CameraService) {
    this.scene.background = new Color(0);
    this.renderer.setRenderTarget(this.renderTarget);
  }

  public ngOnDestroy(): void {
    this.clear();
    this.renderer.clear();
    this.renderTarget.dispose();
  }

  public resizeRenderer(canvas: HTMLCanvasElement) {
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  public addGeos(geos: BufferGeometry[]) {
    geos.forEach((geo) => {
      // 0 is reserved for no pick
      const id = this.meshes.length + 1;
      const material = new MeshLambertMaterial({
        emissive: new Color(id),
        color: new Color(0, 0, 0),
        transparent: true,
        side: DoubleSide,
        alphaTest: 0.5,
        blending: NoBlending,
      });
      const mesh = new Mesh(geo, material);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    });
  }

  public clear() {
    this.meshes.forEach((mesh) => dispose(mesh));
    this.meshes = [];
    this.scene.clear();
  }

  public determineMesh(pos: Vector2 | undefined): Mesh | undefined {
    const camera = this.cameraService.getCamera();
    if (pos) {
      const size = this.renderer.getSize(new Vector2());
      camera.setViewOffset(size.x, size.y, pos.x, pos.y, 1, 1);
      this.renderer.render(this.scene, camera);
      camera.clearViewOffset();
      this.renderer.readRenderTargetPixels(
        this.renderTarget,
        0,
        0,
        1,
        1,
        this.pixelBuffer
      );
      const id =
        (this.pixelBuffer[0] << 16) |
        (this.pixelBuffer[1] << 8) |
        this.pixelBuffer[2];
      return id <= this.meshes.length ? this.meshes[id - 1] : undefined;
    }
    return undefined;
  }

  public getScene(): Scene {
    return this.scene;
  }
}
