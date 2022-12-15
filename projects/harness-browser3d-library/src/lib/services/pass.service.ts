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
import { BordnetMeshService } from './bordnet-mesh.service';
import { CameraService } from './camera.service';
import { CoordinateSystemService } from './coordinate-system.service';
import { EffectComposerService } from './effect-composer.service';
import { PickingService } from './picking.service';
import { SelectionService } from './selection.service';

@Injectable()
export class PassService {
  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
    private readonly coordinateSystemService: CoordinateSystemService,
    private readonly effectComposerService: EffectComposerService,
    private readonly pickingService: PickingService,
    private readonly selectionService: SelectionService
  ) {}

  public setupPasses(): void {
    const camera = this.cameraService.getCamera();
    const passes = [
      this.bordnetMeshService.initPass(camera),
      this.selectionService.initPass(camera),
      this.coordinateSystemService.initPass(),
      // RenderPass cannot be last
      this.pickingService.getPass(),
    ];

    passes.forEach((pass, index) => {
      pass.clear = index === 0;
      pass.renderToScreen = index === passes.length - 1;
    });

    this.effectComposerService.addPasses(passes);
  }
}
