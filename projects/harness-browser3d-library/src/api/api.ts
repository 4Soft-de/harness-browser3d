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

import { Injectable } from '@angular/core';
import { CameraService } from '../lib/services/camera.service';
import { ColorService } from '../lib/services/color.service';
import { AddHarnessesService } from '../lib/services/add-harnesses.service';
import { EffectComposerService } from '../lib/services/effect-composer.service';
import { ViewService } from '../lib/services/view.service';
import { View } from '../views/view';

@Injectable()
export class HarnessBrowser3dLibraryAPI {
  constructor(
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly harnessService: AddHarnessesService,
    private readonly effectComposerService: EffectComposerService,
    private readonly viewService: ViewService,
  ) {}

  public resetCamera() {
    this.cameraService.resetCamera();
  }

  public resizeRendererToCanvasSize() {
    this.effectComposerService.resizeRendererToCanvasSize();
  }

  public resetColors() {
    this.colorService.resetColors();
  }

  public clear() {
    this.harnessService.clear();
  }

  public setView(view: View) {
    this.viewService.setView(view);
  }
}
