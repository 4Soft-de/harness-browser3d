import { Injectable } from '@angular/core';
import { CacheService } from '../lib/services/cache.service';
import { CameraService } from '../lib/services/camera.service';
import { ColorService } from '../lib/services/color.service';
import { RenderService } from '../lib/services/render.service';
import { SceneService } from '../lib/services/scene.service';
import { SelectionService } from '../lib/services/selection.service';
import { isHarness } from '../lib/utils/cast';
import { ErrorUtils } from '../lib/utils/error-utils';

@Injectable({
  providedIn: 'root',
})
export class HarnessBrowser3dLibraryAPI {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly renderService: RenderService,
    private readonly sceneService: SceneService,
    private readonly selectionService: SelectionService
  ) {}

  public resetCamera() {
    this.cameraService.resetCamera();
  }

  public resizeRendererToCanvasSize() {
    this.renderService.resizeRendererToCanvasSize();
  }

  public resetColors(harnessId: string) {
    const harness = this.cacheService.harnessCache.get(harnessId);
    if (isHarness(harness)) {
      this.colorService.setDefaultColors(harness);
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  public clear() {
    this.sceneService.clearScene();
    this.selectionService.clearGeos();
    this.selectionService.resetMesh();
    this.selectionService.resetSphere();
  }
}
