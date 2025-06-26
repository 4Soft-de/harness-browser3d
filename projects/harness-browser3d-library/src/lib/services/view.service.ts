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
import { Node, Segment, Occurrence, Harness } from '../../api/alias';
import { defaultView } from '../../views/default.view';
import { View } from '../../views/view';
import { dispose } from '../utils/dispose-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { BordnetMeshService } from './bordnet-mesh.service';
import { MappingService } from './mapping.service';

@Injectable()
export class ViewService {
  private currentView = defaultView;
  private propertiesCache = new Map<string, Map<string, string>>();

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly mappingService: MappingService,
  ) {}

  public setView(view: View): void {
    this.removeView(this.currentView);
    this.applyMapping(view, true);
    this.currentView = view;
  }

  public refreshView(): void {
    const mesh = this.bordnetMeshService.getBordnetMesh();
    if (mesh && this.currentView.propertyKey) {
      mesh.geometry.deleteAttribute(this.currentView.propertyKey);
      this.applyMapping(this.currentView, false);
    }
  }

  public setCurrentView(harnesses: Harness[]): void {
    dispose(this.bordnetMeshService.getBordnetMesh()?.material);
    this.readProperties(harnesses);
    this.applyMapping(
      this.currentView,
      this.bordnetMeshService.getBordnetMesh()?.material !==
        this.currentView.material,
    );
  }

  private applyMapping(view: View, setMaterial: boolean): void {
    const mesh = this.bordnetMeshService.getBordnetMesh();
    if (mesh) {
      if (setMaterial) {
        mesh.material = view.material;
      }
      if (view.propertyKey && view.defaultValue && view.mapper) {
        const array = this.mappingService.applyMapping(
          view.defaultValue,
          this.propertiesCache.get(view.propertyKey) ??
            new Map<string, string>(),
        );
        GeometryUtils.applyGeoAttribute(
          mesh.geometry,
          view.propertyKey,
          view.mapper(array),
        );
      }
    }
  }

  private removeView(view: View): void {
    const mesh = this.bordnetMeshService.getBordnetMesh();
    if (mesh) {
      dispose(mesh.material);
      if (view.propertyKey) {
        mesh.geometry.deleteAttribute(view.propertyKey);
      }
    }
    this.currentView = defaultView;
  }

  private readProperties(harnesses: Harness[]): void {
    harnesses.forEach((harness) => {
      harness.nodes.forEach(this.setProperty.bind(this));
      harness.segments.forEach(this.setProperty.bind(this));
      harness.occurrences.forEach(this.setProperty.bind(this));
    });
  }

  private setProperty(harnessElement: Node | Segment | Occurrence) {
    if (harnessElement.viewProperties === undefined) return;
    Object.entries(harnessElement.viewProperties).forEach((entry) => {
      const key = entry[0];
      const value = entry[1];
      if (value === undefined) return;
      if (!this.propertiesCache.has(key)) {
        this.propertiesCache.set(key, new Map<string, string>());
      }
      this.propertiesCache.get(key)!.set(harnessElement.id, value);
    });
  }

  public clear(): void {
    this.currentView = defaultView;
    this.propertiesCache.clear();
  }
}
