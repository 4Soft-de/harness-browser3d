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

import { Injectable } from '@angular/core';
import { DirectionalLight, HemisphereLight, Scene } from 'three';

@Injectable({
  providedIn: 'root',
})
export class SceneService {
  private readonly scene: Scene;

  constructor() {
    this.scene = new Scene();
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
  }
}
