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
import { WebGLRenderer } from 'three';
import {
  EffectComposer,
  Pass,
} from 'three/examples/jsm/postprocessing/EffectComposer';
import { CameraService } from './camera.service';
import { SettingsService } from './settings.service';

@Injectable()
export class EffectComposerService implements OnDestroy {
  private effectComposer?: EffectComposer;
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly settingsService: SettingsService
  ) {
    const sub = this.settingsService.updatedCameraSettings.subscribe(() => {
      this.resizeRendererToCanvasSize();
      this.effectComposer?.renderer.setClearColor(
        this.settingsService.backgroundColor
      );
    });
    this.subscription.add(sub);
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.effectComposer?.renderer.dispose();
    this.effectComposer?.passes.forEach((pass) => pass.dispose());
    this.effectComposer?.dispose();
  }

  public initRenderer(canvas: HTMLCanvasElement): void {
    const renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setClearColor(this.settingsService.backgroundColor);
    renderer.autoClear = false;
    this.effectComposer = new EffectComposer(renderer);
  }

  public addPasses(passes: Pass[]): void {
    passes.forEach((pass) => this.effectComposer?.addPass(pass));
  }

  public getRenderer(): WebGLRenderer | undefined {
    return this.effectComposer?.renderer;
  }

  public resizeRendererToCanvasSize(): void {
    if (this.effectComposer?.renderer) {
      const canvas = this.effectComposer.renderer.domElement;

      let width = canvas.clientWidth;
      let height = canvas.clientHeight;

      this.cameraService.getCamera().aspect = width / height;
      this.cameraService.getCamera().updateProjectionMatrix();

      width *= this.settingsService.pixelRatio;
      height *= this.settingsService.pixelRatio;

      this.effectComposer.renderer.setSize(width, height, false);
      this.effectComposer.setSize(width, height);
    }
  }

  public render(): void {
    this.effectComposer?.render();
  }
}
