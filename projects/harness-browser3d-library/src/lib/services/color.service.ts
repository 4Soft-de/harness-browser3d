import { Injectable } from '@angular/core';
import { Color } from 'three';
import {
  Accessory,
  Connector,
  Fixing,
  Harness,
  Protection,
  Segment,
} from '../../api/alias';
import { SetColorAPIStruct } from '../../api/structs';
import { GeometryColors } from '../structs/colors';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { HarnessUtils } from '../utils/harness-utils';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(private readonly cacheService: CacheService) {}

  public setColors(input: SetColorAPIStruct[]) {
    const harness = HarnessUtils.getHarness(
      input.map((color) => color.id),
      this.cacheService
    );
    if (harness) {
      const colors: Map<string, Color> = new Map();
      this.initColors(harness, colors);
      this.convertInput(input, colors);
      this.applyColors(harness, colors);
    } else if (input.length) {
      console.warn(ErrorUtils.notFound('harness'));
    }
  }

  public setDefaultColors(harness: Harness) {
    const colors: Map<string, Color> = new Map();
    this.initColors(harness, colors);
    this.applyColors(harness, colors);
  }

  private conversion(value: number) {
    return value / 255;
  }

  private initColors(harness: Harness, colors: Map<string, Color>) {
    harness.segments.forEach((s: Segment) =>
      colors.set(s.id, GeometryColors.segment)
    );
    harness.protections.forEach((p: Protection) =>
      colors.set(p.id, GeometryColors.protection)
    );
    harness.fixings.forEach((f: Fixing) =>
      colors.set(f.id, GeometryColors.fixing)
    );
    harness.connectors.forEach((c: Connector) =>
      colors.set(c.id, GeometryColors.connector)
    );
    harness.accessories.forEach((a: Accessory) =>
      colors.set(a.id, GeometryColors.accessory)
    );
  }

  private convertInput(input: SetColorAPIStruct[], colors: Map<string, Color>) {
    input.forEach((color) => {
      const value = new Color(
        this.conversion(color.colorR),
        this.conversion(color.colorG),
        this.conversion(color.colorB)
      );
      colors.set(color.id, value);
    });
  }

  private applyColors(harness: Harness, colors: Map<string, Color>) {
    const mapping = this.cacheService.vertexMappings.get(harness.id);
    const harnessMesh = this.cacheService.harnessMeshCache.get(harness.id);

    if (harnessMesh && mapping) {
      const arrays = mapping.apply(
        harnessMesh.geometry,
        GeometryColors.notFound,
        colors
      );
      GeometryUtils.colorGeo(harnessMesh.geometry, arrays);
    } else {
      console.error(ErrorUtils.notFound('harnessMesh or mapping'));
    }
  }
}
