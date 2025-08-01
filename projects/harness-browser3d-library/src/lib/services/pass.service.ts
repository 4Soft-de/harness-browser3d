/*
  Copyright (C) 2025 4Soft GmbH
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
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { BordnetMeshService } from './bordnet-mesh.service';
import { CameraService } from './camera.service';
import { CoordinateSystemService } from './coordinate-system.service';
import { EffectComposerService } from './effect-composer.service';
import { PickingService } from './picking.service';
import { SelectionService } from './selection.service';
import { SettingsService } from './settings.service';

@Injectable()
export class PassService implements OnDestroy {
  private antiAliasPass?: Pass;
  private subscription = new Subscription();

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
    private readonly coordinateSystemService: CoordinateSystemService,
    private readonly effectComposerService: EffectComposerService,
    private readonly pickingService: PickingService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService,
  ) {
    const sub = settingsService.updatedCameraSettings.subscribe(
      () =>
        (this.getAntiAliasPass().enabled =
          this.settingsService.enableAntiAliasing),
    );
    this.subscription.add(sub);
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public setupPasses(): void {
    const camera = this.cameraService.getCamera();

    const rendering = [
      this.bordnetMeshService.initPass(camera),
      this.selectionService.initPass(camera),
      this.pickingService.getPass(),
      this.coordinateSystemService.initPass(),
    ];

    const postProcessing = [
      this.getAntiAliasPass(),
      // RenderPass cannot be last
      new ShaderPass(GammaCorrectionShader),
    ];

    rendering.forEach((pass, index) => {
      pass.clear = index === 0;
      pass.renderToScreen = false;
      pass.needsSwap = false;
    });

    postProcessing.forEach((pass) => {
      pass.renderToScreen = true;
      pass.needsSwap = true;
    });

    this.effectComposerService.addPasses(rendering);
    this.effectComposerService.addPasses(postProcessing);
  }

  public getAntiAliasPass(): Pass {
    if (!this.antiAliasPass) {
      this.antiAliasPass = new SMAAPass();
      this.antiAliasPass.enabled = this.settingsService.enableAntiAliasing;
    }
    return this.antiAliasPass;
  }
}
