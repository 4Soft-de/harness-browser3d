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
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeometryMaterial } from '../structs/material';
import { ErrorUtils } from '../utils/error-utils';
import { CameraService } from './camera.service';
import { BufferGeometry, Mesh, Scene } from 'three';
import { Subscription } from 'rxjs';
import { SettingsService } from './settings.service';
import { dispose } from '../utils/dispose-utils';
import { LightsService } from './lights.service';
import { PassService } from './pass.service';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

@Injectable()
export class SelectionService implements OnDestroy {
  private scene: Scene = new Scene();
  private selectMesh?: Mesh;
  private readonly harnessElementGeos: Map<string, BufferGeometry> = new Map();
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    lightsService: LightsService,
    passService: PassService,
    private readonly settingsService: SettingsService
  ) {
    lightsService.addLights(this.scene);
    const pass = new RenderPass(this.scene, this.cameraService.getCamera());
    pass.clearDepth = true;
    passService.addPass(pass);

    this.subscription.add(
      this.settingsService.updatedGeometrySettings.subscribe(() => {
        this.clearGeos();
        this.resetMesh();
      })
    );
  }

  public ngOnDestroy(): void {
    this.resetMesh();
    this.subscription.unsubscribe();
  }

  public addGeos(geos: BufferGeometry[]) {
    geos.forEach((geo) => this.harnessElementGeos.set(geo.name, geo));
  }

  public clearGeos() {
    this.harnessElementGeos.forEach((geo) => geo.dispose());
    this.harnessElementGeos.clear();
  }

  public selectElements(
    ids: string[],
    zoom: boolean = this.settingsService.zoomSelection
  ) {
    this.resetMesh();

    const selectedObjects: BufferGeometry[] = [];
    ids.forEach((id) => {
      const cacheElem = this.harnessElementGeos.get(id);
      if (cacheElem) {
        selectedObjects.push(cacheElem);
      } else {
        console.warn(ErrorUtils.notFound(id));
      }
    });
    if (selectedObjects.length > 0) {
      const selectGeo = mergeBufferGeometries(selectedObjects);
      this.selectMesh = new Mesh(selectGeo, GeometryMaterial.selection);
      this.scene.add(this.selectMesh);
    }
    if (zoom) {
      this.zoomSelection();
    }
  }

  public resetMesh() {
    if (this.selectMesh) {
      this.scene.remove(this.selectMesh);
      dispose(this.selectMesh);
      this.selectMesh = undefined;
    }
  }

  private zoomSelection() {
    if (this.selectMesh) {
      this.cameraService.focusCameraOnMesh(this.selectMesh);
    } else {
      this.cameraService.resetCamera();
    }
  }
}
