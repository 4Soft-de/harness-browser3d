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
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  Scene,
  ShaderLib,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { dispose } from '../utils/dispose-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { CameraService } from './camera.service';

@Injectable()
export class PickingPickerService implements OnDestroy {
  private readonly scene = new Scene();
  private meshes: Mesh[] = [];
  private readonly renderer = new WebGLRenderer();
  private readonly renderTarget = new WebGLRenderTarget(1, 1);
  private readonly pixelBuffer = new Uint8Array(4);
  private readonly material: ShaderMaterial;

  constructor(private readonly cameraService: CameraService) {
    this.scene.background = new Color(0);
    this.material = new ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
    this.renderer.setRenderTarget(this.renderTarget);
  }

  get vertexShader(): string {
    let shader = ShaderLib.basic.vertexShader;

    const declarations = `
      attribute vec3 pIdColor;
      varying vec4 vIdColor;
    `;

    const code = `
      vIdColor = vec4(pIdColor, 0) / vec4(255);
    `;

    let anchor = `#include <common>`;
    shader = shader.replace(anchor, anchor + declarations);
    anchor = `#include <fog_vertex>`;
    shader = shader.replace(anchor, anchor + code);

    return shader;
  }

  get fragmentShader(): string {
    return `
      varying vec4 vIdColor;
      void main() {
        gl_FragColor = vIdColor;
      }
    `;
  }

  public ngOnDestroy(): void {
    this.clear();
    this.renderer.clear();
    this.renderTarget.dispose();
    this.material.dispose();
  }

  public resizeRenderer(canvas: HTMLCanvasElement) {
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  public addGeos(geos: BufferGeometry[]) {
    geos.forEach((geo) => {
      // 0 is reserved for no pick
      const idColor = new Color(this.meshes.length + 1)
        .toArray()
        .map((color) => color * 255);
      const vertexCount = geo.attributes['position']?.count;
      const itemSize = 3;
      const array = new Uint8Array(itemSize * vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        idColor.forEach(
          (color, index) => (array[itemSize * i + index] = color)
        );
      }
      GeometryUtils.applyGeoAttribute(
        geo,
        'pIdColor',
        new BufferAttribute(array, itemSize)
      );
      const mesh = new Mesh(geo);
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
      this.scene.overrideMaterial = this.material;
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
