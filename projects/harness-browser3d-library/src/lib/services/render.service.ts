import { Injectable } from '@angular/core';
import { Camera, Scene, WebGLRenderer } from 'three';
import {
  EffectComposer,
  Pass,
} from 'three/examples/jsm/postprocessing/EffectComposer';
import { GeometryColors } from '../structs/colors';
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
export class RenderService {
  private postProcessor?: EffectComposer;

  constructor(
    private readonly cameraService: CameraService,
    private readonly coordinateSystemService: CoordinateSystemService,
    private readonly sceneService: SceneService,
    private readonly settingsService: SettingsService
  ) {}

  initRenderer(canvas: HTMLCanvasElement): void {
    const renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setClearColor(GeometryColors.clear);
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
