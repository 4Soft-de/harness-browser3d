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
import { BufferGeometry, Mesh, Scene } from 'three';
import { dispose } from '../utils/dispose-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable()
export class BordnetMeshService implements OnDestroy {
  private bordnetMesh?: Mesh;

  private readonly scene: Scene;
  private subscription: Subscription = new Subscription();

  constructor(settingsService: SettingsService) {
    this.scene = new Scene();
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(this.clear.bind(this))
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public getBordnetGeo(): BufferGeometry | undefined {
    return this.bordnetMesh?.geometry;
  }

  public getBordnetMesh(): Mesh | undefined {
    return this.bordnetMesh;
  }

  public getVerticesCount(): number {
    return this.bordnetMesh?.geometry?.attributes['position']?.count ?? 0;
  }

  public addGeos(geos: Map<string, BufferGeometry>): void {
    if (!geos.size) {
      console.error('geos are empty');
      return;
    }
    const harnessGeos: BufferGeometry[] = [];
    if (this.bordnetMesh) {
      GeometryUtils.clean(this.bordnetMesh.geometry);
      harnessGeos.push(this.bordnetMesh.geometry);
    }
    geos.forEach((geo) => harnessGeos.push(geo));
    const mergedHarnessGeo = GeometryUtils.mergeGeos(harnessGeos);
    this.bordnetMesh = new Mesh(mergedHarnessGeo);
    this.scene.add(this.bordnetMesh);
  }

  public clear(): void {
    if (this.bordnetMesh) {
      dispose(this.bordnetMesh);
      this.scene.remove(this.bordnetMesh);
      this.bordnetMesh = undefined;
    }
  }

  public getScene() {
    return this.scene;
  }
}
