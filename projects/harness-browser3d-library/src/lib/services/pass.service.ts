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
import { Subject, Subscription } from 'rxjs';
import { Renderer, Vector2, WebGLRenderer } from 'three';
import {
  EffectComposer,
  Pass,
} from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ErrorUtils } from '../utils/error-utils';
import { BordnetMeshService } from './bordnet-mesh.service';
import { CameraService } from './camera.service';
import { SettingsService } from './settings.service';

@Injectable()
export class PassService implements OnDestroy {
  private postProcessor?: EffectComposer;
  private addedPasses: Pass[] = [];
  private subscription: Subscription = new Subscription();
  private size$: Subject<Vector2> = new Subject();

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
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

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public initRenderer(canvas: HTMLCanvasElement): void {
    const renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setClearColor(this.settingsService.backgroundColor);
    renderer.autoClear = false;
    this.postProcessor = new EffectComposer(renderer);
    this.resizeRendererToCanvasSize();
    this.addedPasses.unshift(
      new RenderPass(
        this.bordnetMeshService.getScene(),
        this.cameraService.getCamera()
      )
    );
    this.addedPasses.forEach((pass, index) => {
      pass.renderToScreen = index === this.addedPasses.length - 1;
      pass.clear = index === 0;
      this.postProcessor!.addPass(pass);
    });
  }

  public getRenderer(): Renderer | undefined {
    return this.postProcessor?.renderer;
  }

  public getSize(): Subject<Vector2> {
    return this.size$;
  }

  public addPass(pass: Pass): void {
    this.addedPasses.push(pass);
  }

  public resizeRendererToCanvasSize(): void {
    if (this.postProcessor?.renderer) {
      const canvas = this.postProcessor.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      this.cameraService.getCamera().aspect = width / height;
      this.cameraService.getCamera().updateProjectionMatrix();

      this.setResolution(width, height);
      this.size$.next(new Vector2(width, height));
    } else {
      console.error(ErrorUtils.isUndefined('renderer or composer'));
    }
  }

  public render(): void {
    this.postProcessor?.render();
  }

  private setResolution(width: number, height: number): void {
    if (this.postProcessor?.renderer) {
      this.postProcessor.renderer.setPixelRatio(
        this.settingsService.pixelRatio
      );
      this.postProcessor.renderer.setSize(width, height, false);
      this.postProcessor.setPixelRatio(this.settingsService.pixelRatio);
      this.postProcessor.setSize(width, height);
    }
  }
}
