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

import { Harness } from '../../api/alias';
import { Injectable, OnDestroy } from '@angular/core';
import { GeometryService } from './geometry.service';
import { SceneService } from './scene.service';
import { SelectionService } from './selection.service';
import { BufferGeometry } from 'three';
import { MappingService } from './mapping.service';
import { ViewService } from './view.service';
import { ColorService } from './color.service';
import { CameraService } from './camera.service';
import { SettingsService } from './settings.service';
import { EnableService } from './enable.service';
import { CacheService } from './cache.service';
import { Subscription } from 'rxjs';

@Injectable()
export class HarnessService implements OnDestroy {
  private loadedHarnesses = new Set<string>();
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cacheService: CacheService,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly enableService: EnableService,
    private readonly geometryService: GeometryService,
    private readonly mappingService: MappingService,
    private readonly sceneService: SceneService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService,
    private readonly viewService: ViewService
  ) {
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(() => {
        this.clearCaches();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  addHarness(harness: Harness): void {
    if (this.loadedHarnesses.has(harness.id)) {
      console.warn(`harness ${harness.id} has already been loaded`);
      return;
    }
    this.loadedHarnesses.add(harness.id);
    const harnessElementGeos = this.geometryService.processHarness(harness);
    this.createHarnessElementMappings(harnessElementGeos);
    this.cacheService.addGeos(harnessElementGeos);
    this.colorService.initializeDefaultColors(harness);
    this.selectionService.addGeos(harnessElementGeos);
    this.sceneService.replaceMesh(this.cacheService.getBordnetMesh());
    this.enableService.enableHarness(harness);
    this.viewService.setCurrentView(harness);
    if (this.settingsService.addHarnessResetCamera) {
      this.cameraService.resetCamera();
    }
  }

  public clearCaches(): void {
    this.colorService.clear();
    this.enableService.clear();
    this.cacheService.clear();
    this.mappingService.clear();
    this.loadedHarnesses.clear();
  }

  private createHarnessElementMappings(
    harnessElementGeos: Map<string, BufferGeometry>
  ): void {
    const harnessGeos: BufferGeometry[] = [];
    harnessElementGeos.forEach((geo) => harnessGeos.push(geo));
    this.mappingService.addHarnessElementVertexMappings(harnessElementGeos);
  }
}
