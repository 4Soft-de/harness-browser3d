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
import { Identifiable } from '../../api/alias';
import { View } from '../../views/view';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable()
export class ViewService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public applyView(view: View, harnessId: string): void {
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    if (mesh) {
      mesh.material = view.material;
      if (view.propertyKey) {
        const array = this.mappingService.applyMapping(
          harnessId,
          view.defaultValue,
          this.readProperties(harnessId, view.propertyKey)
        );
        GeometryUtils.applyGeoAttribute(
          mesh.geometry,
          view.propertyKey,
          view.mapper(array)
        );
      }
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  public disposeView(view: View, harnessId: string): void {
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    if (mesh) {
      if ('length' in mesh.material) {
        mesh.material.forEach((material) => material.dispose());
        mesh.material = [];
      } else if (mesh.material) {
        mesh.material.dispose();
      }
      if (view.propertyKey) {
        mesh.geometry.deleteAttribute(view.propertyKey);
      }
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  private readProperties(
    harnessId: string,
    harnessPropertyKey: string
  ): Map<string, string> {
    const properties: Map<string, string> = new Map();
    const set = (harnessElement: Identifiable) => {
      const property = this.readProperty(harnessElement, harnessPropertyKey);
      if (property) {
        properties.set(harnessElement.id, property);
      }
    };
    const harness = this.cacheService.harnessCache.get(harnessId);
    if (harness) {
      harness.segments.forEach(set);
      harness.protections.forEach(set);
      harness.fixings.forEach(set);
      harness.connectors.forEach(set);
      harness.accessories.forEach(set);
    }
    return properties;
  }

  private readProperty(
    object: any,
    harnessPropertyKey: string
  ): string | undefined {
    if ('viewProperties' in object) {
      return object.viewProperties[harnessPropertyKey];
    } else return undefined;
  }
}
