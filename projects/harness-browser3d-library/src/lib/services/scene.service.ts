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
import { DirectionalLight, HemisphereLight, Scene } from 'three';
import { SettingsService } from './settings.service';

@Injectable()
export class SceneService implements OnDestroy {
  private readonly scene: Scene;
  private subscription: Subscription = new Subscription();

  constructor(settingsService: SettingsService) {
    this.scene = new Scene();
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(() => {
        this.clearScene();
        this.setupScene();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public getScene() {
    return this.scene;
  }

  public setupScene() {
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 0, 1).normalize();
    this.scene.add(directionalLight);

    const hemisphereLight = new HemisphereLight(0xffffff, 0xcccccc, 0.3);
    this.scene.add(hemisphereLight);
  }

  public clearScene() {
    this.scene.remove.apply(this.scene, this.scene.children);
    this.setupScene();
  }
}
