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
import { BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { Harness, Identifiable } from '../../api/alias';
import { View } from '../../api/view';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable({
  providedIn: 'root',
})
export class ViewService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public applyView(view: View, harness: Harness): void {
    const mesh = this.cacheService.harnessMeshCache.get(harness.id);
    if (mesh) {
      mesh.material = new ShaderMaterial({
        vertexShader: view.vertexShader,
        fragmentShader: view.fragmentShader,
      });
      const array = this.mappingService.applyMapping(
        harness,
        view.defaultValue,
        this.readProperties(harness, view.viewProperty)
      );
      this.applyAttributes(
        mesh.geometry,
        view.viewProperty,
        view.mapper(array)
      );
    }
  }

  private readProperties(
    harness: Harness,
    viewProperty: string
  ): Map<string, string> {
    const properties: Map<string, string> = new Map();
    const set = (harnessElement: Identifiable) => {
      const property = this.readProperty(harnessElement, viewProperty);
      if (property) {
        properties.set(harnessElement.id, property);
      }
    };
    harness.segments.forEach(set);
    harness.protections.forEach(set);
    harness.fixings.forEach(set);
    harness.connectors.forEach(set);
    harness.accessories.forEach(set);
    return properties;
  }

  private readProperty(object: any, viewProperty: string): string | undefined {
    if ('viewProperties' in object) {
      return object.viewProperties[viewProperty];
    } else return undefined;
  }

  private applyAttributes(
    harnessGeo: BufferGeometry,
    name: string,
    bufferAttribute: BufferAttribute
  ): void {
    const attributeSize =
      bufferAttribute.array.length / bufferAttribute.itemSize;
    if (harnessGeo.attributes['position'].count != attributeSize) {
      console.error(
        `vertex count ${harnessGeo.attributes['position'].count} and buffer attribute size ${attributeSize} must be same`
      );
      return;
    }
    harnessGeo.setAttribute(name, bufferAttribute);
  }
}
