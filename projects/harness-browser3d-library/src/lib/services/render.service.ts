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
import { Subscription } from 'rxjs';
import { Camera, Scene, WebGLRenderer } from 'three';
import {
  EffectComposer,
  Pass,
} from 'three/examples/jsm/postprocessing/EffectComposer';
import { ErrorUtils } from '../utils/error-utils';
import { CameraService } from './camera.service';
import { CoordinateSystemService } from './coordinate-system.service';
import { SceneService } from './scene.service';
import { SettingsService } from './settings.service';

class DefaultPass extends Pass {
  constructor(private readonly scene: Scene, private readonly camera: Camera) {
    super();
  }
  public override render(renderer: WebGLRenderer) {
    renderer.render(this.scene, this.camera);
  }
}

@Injectable({
  providedIn: 'root',
})
export class RenderService implements OnDestroy {
  private postProcessor?: EffectComposer;
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly coordinateSystemService: CoordinateSystemService,
    private readonly sceneService: SceneService,
    private readonly settingsService: SettingsService
  ) {
    this.subscription.add(
      this.settingsService.updatedCameraSettings.subscribe(() => {
        this.resizeRendererToCanvasSize();
        this.postProcessor?.renderer.setClearColor(
          this.settingsService.backgroundColor
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  initRenderer(canvas: HTMLCanvasElement): void {
    const renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setClearColor(this.settingsService.backgroundColor);
    renderer.autoClear = false;
    this.postProcessor = new EffectComposer(renderer);
    this.postProcessor.addPass(
      new DefaultPass(
        this.sceneService.getScene(),
        this.cameraService.getCamera()
      )
    );
  }

  public getRenderer() {
    return this.postProcessor?.renderer;
  }

  public resizeRendererToCanvasSize() {
    if (this.postProcessor?.renderer) {
      const canvas = this.postProcessor.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      this.cameraService.getCamera().aspect = width / height;
      this.cameraService.getCamera().updateProjectionMatrix();

      this.setResolution(width, height);
    } else {
      console.error(ErrorUtils.isUndefined('renderer or composer'));
    }
  }

  private setResolution(width: number, height: number) {
    if (this.postProcessor?.renderer) {
      this.postProcessor.renderer.setPixelRatio(
        this.settingsService.pixelRatio
      );
      this.postProcessor.renderer.setSize(width, height, false);
      this.postProcessor.setPixelRatio(this.settingsService.pixelRatio);
      this.postProcessor.setSize(width, height);
    }
  }

  public mainLoop() {
    const controls = this.cameraService.getControls();

    if (controls) {
      controls.update();
      this.coordinateSystemService.animate(controls.target);
    } else {
      console.error(ErrorUtils.isUndefined('controls'));
    }

    if (this.postProcessor?.renderer) {
      this.postProcessor.renderer.clear();
      this.postProcessor.render();
      this.coordinateSystemService.render(this.postProcessor.renderer);
    } else {
      console.error(ErrorUtils.isUndefined('renderer or composer'));
    }
  }
}
