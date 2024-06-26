/*
  Copyright (C) 2024 4Soft GmbH
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
  Color,
  Float32BufferAttribute,
  NoColorSpace,
  ShaderLib,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { Node, Segment, Occurrence, Harness } from '../../api/alias';
import { GeometryUtils } from '../utils/geometry-utils';
import { BordnetMeshService } from './bordnet-mesh.service';
import { CameraService } from './camera.service';
import { EffectComposerService } from './effect-composer.service';
import { MappingService } from './mapping.service';

@Injectable()
export class PickingPickerService implements OnDestroy {
  private harnessElementIndices: string[] = [];
  private readonly harnessElementIndexColors = new Map<string, Color>();
  private readonly renderTarget = new WebGLRenderTarget(1, 1);
  private readonly pixelBuffer = new Uint8Array(4);
  private readonly material: ShaderMaterial;

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
    private readonly effectComposerService: EffectComposerService,
    private readonly mappingService: MappingService,
  ) {
    this.material = new ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
  }

  get vertexShader(): string {
    let shader = ShaderLib.basic.vertexShader;

    const declarations = `
      attribute vec3 pIndexColor;
      varying vec4 vIndexColor;
    `;

    const code = `
      vIndexColor = vec4(pIndexColor, 0);
    `;

    let anchor = `#include <common>`;
    shader = shader.replace(anchor, anchor + declarations);
    anchor = `#include <fog_vertex>`;
    shader = shader.replace(anchor, anchor + code);

    return shader;
  }

  get fragmentShader(): string {
    return `
      varying vec4 vIndexColor;
      void main() {
        gl_FragColor = vIndexColor;
      }
    `;
  }

  public ngOnDestroy(): void {
    this.clear();
    this.renderTarget.dispose();
    this.material.dispose();
  }

  public initializePickingIndices(harnesses: Harness[]) {
    const geo = this.bordnetMeshService.getBordnetGeo();
    if (!geo) {
      return;
    }

    harnesses.forEach((harness) => {
      harness.nodes.forEach((node) => this.addHarnessElement(node));
      harness.segments.forEach((segment) => this.addHarnessElement(segment));
      harness.occurrences.forEach((occurrence) =>
        this.addHarnessElement(occurrence),
      );
    });

    const array: number[] = [];
    this.mappingService
      .applyMapping(
        new Color().setHex(0, NoColorSpace),
        this.harnessElementIndexColors,
      )
      .forEach((color) => array.push(color.r, color.g, color.b));

    GeometryUtils.applyGeoAttribute(
      geo,
      'pIndexColor',
      new Float32BufferAttribute(array, 3),
    );
  }

  private addHarnessElement(harnessElement: Node | Segment | Occurrence) {
    // 0 is reserved for no pick
    const index = this.harnessElementIndices.length + 1;
    this.harnessElementIndices.push(harnessElement.id);
    const indexColor = new Color().setHex(index, NoColorSpace);
    this.harnessElementIndexColors.set(harnessElement.id, indexColor);
  }

  public clear() {
    this.harnessElementIndices = [];
    this.harnessElementIndexColors.clear();
  }

  public determineHarnessElementId(
    pos: Vector2 | undefined,
  ): string | undefined {
    const renderer = this.effectComposerService.getRenderer();
    if (pos && renderer) {
      this.render(pos, renderer);
      renderer.readRenderTargetPixels(
        this.renderTarget,
        0,
        0,
        1,
        1,
        this.pixelBuffer,
      );
      const index = this.extractIndex();
      return index <= this.harnessElementIndices.length && index > 0
        ? this.harnessElementIndices[index - 1]
        : undefined;
    }
    return undefined;
  }

  private render(pos: Vector2, renderer: WebGLRenderer): void {
    const size = renderer.getSize(new Vector2());
    const camera = this.cameraService.getCamera();
    const scene = this.bordnetMeshService.getScene();

    const oldRenderTarget = renderer.getRenderTarget();
    const oldClearColor = renderer.getClearColor(new Color());

    renderer.setClearColor(new Color().setHex(0, NoColorSpace));
    camera.setViewOffset(size.x, size.y, pos.x, pos.y, 1, 1);
    renderer.setRenderTarget(this.renderTarget);
    scene.overrideMaterial = this.material;

    renderer.clear();
    renderer.render(scene, camera);

    scene.overrideMaterial = null;
    renderer.setRenderTarget(oldRenderTarget);
    renderer.setClearColor(oldClearColor);
    camera.clearViewOffset();
  }

  private extractIndex(): number {
    return (
      (this.pixelBuffer[0] << 16) |
      (this.pixelBuffer[1] << 8) |
      this.pixelBuffer[2]
    );
  }
}
