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
import { SceneService } from './scene.service';
import { GeometryUtils } from '../utils/geometry-utils';
import { BufferGeometry, Mesh } from 'three';
import { Subscription } from 'rxjs';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class SelectionService implements OnDestroy {
  private selectMesh: Mesh | undefined;
  private readonly harnessElementGeos: Map<string, BufferGeometry> = new Map();
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly sceneService: SceneService,
    private readonly settingsService: SettingsService
  ) {
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(() => {
        this.clearGeos();
        this.resetMesh();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public addGeos(geos: Map<string, BufferGeometry>) {
    for (const entry of geos) {
      this.harnessElementGeos.set(entry[0], entry[1]);
    }
  }

  public clearGeos() {
    this.harnessElementGeos.clear();
  }

  public selectElements(ids: string[]) {
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
      const selectCenter = GeometryUtils.centerGeometry(selectGeo);
      this.selectMesh.position.copy(selectCenter);
      this.sceneService.getScene().add(this.selectMesh);
    }
    if (this.settingsService.zoomSelection) {
      this.zoomSelection();
    }
  }

  public resetMesh() {
    if (this.selectMesh) {
      this.sceneService.getScene().remove(this.selectMesh);
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
