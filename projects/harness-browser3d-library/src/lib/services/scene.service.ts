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
import { Subscription } from 'rxjs';
import { Scene } from 'three';
import { CacheService } from './cache.service';
import { LightsService } from './lights.service';
import { SettingsService } from './settings.service';

@Injectable()
export class SceneService implements OnDestroy {
  private readonly scene: Scene;
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly cacheService: CacheService,
    lightsService: LightsService,
    settingsService: SettingsService
  ) {
    this.scene = new Scene();
    lightsService.addLights(this.scene);
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(() => {
        this.removeMesh();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public getScene() {
    return this.scene;
  }

  public replaceMesh() {
    const mesh = this.cacheService.getBordnetMesh();
    if (mesh) {
      this.removeMesh();
      this.scene.add(mesh);
    }
  }

  public removeMesh() {
    const mesh = this.scene.getObjectByName(this.cacheService.bordnetMeshName);
    if (mesh) {
      this.scene.remove(mesh);
    }
  }
}
