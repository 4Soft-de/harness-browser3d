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

import { GeometryUtils } from '../utils/geometry-utils';
import { Harness } from '../../api/alias';
import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { GeometryService } from './geometry.service';
import { SceneService } from './scene.service';
import { SelectionService } from './selection.service';
import { BufferGeometry, Mesh, Scene } from 'three';
import { MappingService } from './mapping.service';
import { ViewService } from './view.service';
import { ColorService } from './color.service';
import { CameraService } from './camera.service';
import { SettingsService } from './settings.service';

@Injectable()
export class HarnessService {
  private harness?: Harness;
  private harnessElementGeos: Map<string, BufferGeometry> = new Map();

  constructor(
    private readonly cacheService: CacheService,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly geometryService: GeometryService,
    private readonly mappingService: MappingService,
    private readonly sceneService: SceneService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService,
    private readonly viewService: ViewService
  ) {}

  addHarness(harness: Harness) {
    this.harness = harness;
    this.cacheService.harnessCache.set(harness.id, harness);
    this.harnessElementGeos = this.geometryService.processHarness(harness);

    if (!this.cacheService.harnessMeshCache.has(harness.id)) {
      this.selectionService.addGeos(this.harnessElementGeos);
      this.addHarnessMesh(
        harness.id,
        this.mergeGeosIntoHarness(),
        this.sceneService.getScene()
      );
      this.colorService.setDefaultColors(harness.id);
      this.viewService.applyCurrentView(harness.id);
      if (this.settingsService.addHarnessResetCamera) {
        this.cameraService.resetCamera();
      }
    }
  }

  private mergeGeosIntoHarness() {
    const harnessGeos: BufferGeometry[] = [];
    this.harnessElementGeos.forEach((geo) => harnessGeos.push(geo));
    const mergedHarnessGeo = GeometryUtils.mergeGeos(harnessGeos);
    if (this.harness) {
      this.mappingService.addHarnessElementVertexMappings(
        this.harness,
        this.harnessElementGeos
      );
    }

    const position = GeometryUtils.centerGeometry(mergedHarnessGeo);
    const mesh = new Mesh(mergedHarnessGeo);
    mesh.position.copy(position);
    return mesh;
  }

  private addHarnessMesh(harnessId: string, mesh: Mesh, scene: Scene) {
    this.cacheService.harnessMeshCache.set(harnessId, mesh);
    scene.add(mesh);
  }
}
