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

import { Injectable } from '@angular/core';
import { BufferGeometry, Camera, Mesh, Scene } from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { dispose } from '../utils/dispose-utils';
import { GeometryUtils } from '../utils/geometry-utils';

@Injectable()
export class BordnetMeshService {
  private bordnetMesh?: Mesh;
  private readonly scene: Scene;

  constructor() {
    this.scene = new Scene();
  }

  public initPass(camera: Camera): Pass {
    return new RenderPass(this.scene, camera);
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

  public addGeos(geos: BufferGeometry[]): void {
    if (!geos.length) {
      console.error('geos are empty');
      return;
    }
    if (this.bordnetMesh) {
      GeometryUtils.clean(this.bordnetMesh.geometry);
      geos.unshift(this.bordnetMesh.geometry);
    }
    const mergedHarnessGeo = GeometryUtils.mergeGeos(geos);
    if (this.bordnetMesh) {
      geos.shift();
    }
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
