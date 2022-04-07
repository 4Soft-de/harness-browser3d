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
import { CacheService } from '../lib/services/cache.service';
import { CameraService } from '../lib/services/camera.service';
import { ColorService } from '../lib/services/color.service';
import { RenderService } from '../lib/services/render.service';
import { SceneService } from '../lib/services/scene.service';
import { SelectionService } from '../lib/services/selection.service';
import { ViewService } from '../lib/services/view.service';
import { isHarness } from '../lib/utils/cast';
import { ErrorUtils } from '../lib/utils/error-utils';
import { Harness } from './alias';
import { View } from './view';

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
    private readonly selectionService: SelectionService,
    private readonly viewService: ViewService
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

  public setView(view: View, harness: Harness) {
    this.viewService.applyView(view, harness);
  }
}
