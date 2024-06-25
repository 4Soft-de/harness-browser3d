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

import { Graphic, Harness } from '../../api/alias';
import { Injectable, OnDestroy } from '@angular/core';
import { GeometryService } from './geometry.service';
import { SelectionService } from './selection.service';
import { BufferGeometry } from 'three';
import { MappingService } from './mapping.service';
import { ViewService } from './view.service';
import { ColorService } from './color.service';
import { CameraService } from './camera.service';
import { SettingsService } from './settings.service';
import { EnableService } from './enable.service';
import { BordnetMeshService } from './bordnet-mesh.service';
import { Subscription } from 'rxjs';
import { PreprocessService } from './preprocess.service';
import { LoadingService } from './loading.service';
import { GeometryModeAPIEnum } from '../../api/structs';
import { DiffService } from './diff.service';
import { PickingPickerService } from './picking-picker.service';
import { PickingService } from './picking.service';

@Injectable()
export class AddHarnessesService implements OnDestroy {
  private loadedHarnesses = new Set<string>();
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly cameraService: CameraService,
    private readonly colorService: ColorService,
    private readonly diffService: DiffService,
    private readonly enableService: EnableService,
    private readonly geometryService: GeometryService,
    private readonly loadingService: LoadingService,
    private readonly mappingService: MappingService,
    private readonly pickingService: PickingService,
    private readonly pickingPickerService: PickingPickerService,
    private readonly preprocessService: PreprocessService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService,
    private readonly viewService: ViewService,
  ) {
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(this.clear.bind(this)),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public addHarnesses(harnesses: Harness[]): void {
    if (harnesses.length === 0) {
      return;
    }

    const notLoadedHarnesses: Harness[] = [];
    harnesses.forEach((harness) => {
      if (this.loadedHarnesses.has(harness.id)) {
        console.warn(`harness ${harness.id} has already been loaded`);
      } else {
        this.loadedHarnesses.add(harness.id);
        notLoadedHarnesses.push(harness);
      }
    });

    const preprocessedHarnesses =
      this.preprocessService.preprocessHarnesses(notLoadedHarnesses);

    if (this.settingsService.geometryMode === GeometryModeAPIEnum.loaded) {
      const graphics: Graphic[] = [];
      preprocessedHarnesses.forEach((harness) =>
        harness.graphics?.forEach((graphic) => graphics.push(graphic)),
      );
      this.loadingService.loadGraphics(graphics);
    }

    const harnessElementGeos = this.geometryService.processHarnesses(
      preprocessedHarnesses,
    );

    this.createHarnessElementMappings(harnessElementGeos);
    this.bordnetMeshService.addGeos(harnessElementGeos);
    this.colorService.initializeDefaultColors(preprocessedHarnesses);
    this.selectionService.addGeos(harnessElementGeos);
    this.pickingService.addGeos(harnessElementGeos);
    this.pickingPickerService.initializePickingIndices(preprocessedHarnesses);
    this.enableService.enableHarnesses(preprocessedHarnesses);
    this.diffService.applyDiffState(preprocessedHarnesses);
    this.viewService.setCurrentView(preprocessedHarnesses);

    if (this.settingsService.addHarnessResetCamera) {
      this.cameraService.resetCamera();
    }
  }

  public clear(): void {
    this.loadingService.clear();
    this.selectionService.clearGeos();
    this.selectionService.resetMesh();
    this.pickingPickerService.clear();
    this.pickingService.clear();
    this.colorService.clear();
    this.enableService.clear();
    this.bordnetMeshService.clear();
    this.mappingService.clear();
    this.loadedHarnesses.clear();
  }

  private createHarnessElementMappings(
    harnessElementGeos: BufferGeometry[],
  ): void {
    const harnessGeos: BufferGeometry[] = [];
    harnessElementGeos.forEach((geo) => harnessGeos.push(geo));
    this.mappingService.addHarnessElementVertexMappings(harnessElementGeos);
  }
}
