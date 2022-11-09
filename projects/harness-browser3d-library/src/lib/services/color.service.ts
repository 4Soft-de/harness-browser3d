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
import { Color, Float32BufferAttribute } from 'three';
import { isOccurrence, isSegment } from '../../api/predicates';
import {
  Node,
  Segment,
  Occurrence,
  Harness,
  SetColorAPIStruct,
} from '../../public-api';
import { GeometryColors } from '../structs/colors';
import { GeometryUtils } from '../utils/geometry-utils';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable()
export class ColorService {
  private readonly key = 'pColor';
  private readonly defaultKey = 'pDefaultColor';

  private readonly defaultColors = new Map<string, Color>();

  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public setColors(colors: SetColorAPIStruct[]): void {
    this.applyColors(this.key, this.createMap(colors));
  }

  public resetColors(): void {
    this.applyColors(this.key, new Map<string, Color>());
  }

  public initializeDefaultColors(harnesses: Harness[]): void {
    harnesses.forEach(this.initializeDefaultColorsImplementation.bind(this));
  }

  private initializeDefaultColorsImplementation(harness: Harness): void {
    const set = (harnessElement: Node | Segment | Occurrence) => {
      this.defaultColors.set(
        harnessElement.id,
        this.getDefaultColor(harnessElement)
      );
    };
    harness.nodes.forEach(set);
    harness.segments.forEach(set);
    harness.occurrences.forEach(set);
    this.applyColors(this.defaultKey, this.defaultColors);
  }

  private getDefaultColor(harnessElement: Node | Segment | Occurrence): Color {
    let color = GeometryColors.node;
    if (isSegment(harnessElement)) {
      color = GeometryColors.segment;
    }
    if (isOccurrence(harnessElement)) {
      color = GeometryColors.getColor(harnessElement.partType);
    }
    return color;
  }

  private applyColors(key: string, colors: Map<string, Color>) {
    const geo = this.cacheService.getBordnetGeo();
    if (geo) {
      const array: number[] = [];
      this.mappingService
        .applyMapping(GeometryColors.empty, colors)
        .forEach((color) => array.push(color.r, color.g, color.b));
      GeometryUtils.applyGeoAttribute(
        geo,
        key,
        new Float32BufferAttribute(array, 3)
      );
    }
  }

  private createMap(colors: SetColorAPIStruct[]): Map<string, Color> {
    const map: Map<string, Color> = new Map();
    colors.forEach((entry) => map.set(entry.harnessElementId, entry.color));
    return map;
  }

  public clear(): void {
    this.defaultColors.clear();
  }
}
