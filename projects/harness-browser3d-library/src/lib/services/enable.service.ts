import { Injectable } from '@angular/core';
import { Int8BufferAttribute } from 'three';
import { Harness } from '../../public-api';
import { GeometryUtils } from '../utils/geometry-utils';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable()
export class EnableService {
  private readonly key = 'pEnabled';
  private readonly enabledHarnessElementsCache = new Map<string, boolean>();

  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public enableElements(ids: string[]): void {
    ids.forEach((id) => this.enabledHarnessElementsCache.set(id, true));
    this.applyEnabled();
  }

  public disableElements(ids: string[]): void {
    ids.forEach((id) => this.enabledHarnessElementsCache.set(id, false));
    this.applyEnabled();
  }

  public enableHarness(harness: Harness) {
    harness.nodes.forEach((node) =>
      this.enabledHarnessElementsCache.set(node.id, true)
    );
    harness.segments.forEach((segment) =>
      this.enabledHarnessElementsCache.set(segment.id, true)
    );
    harness.occurrences.forEach((occurrence) =>
      this.enabledHarnessElementsCache.set(occurrence.id, true)
    );
    this.applyEnabled();
  }

  private applyEnabled() {
    const geo = this.cacheService.getBordnetGeo();
    if (geo) {
      const array = this.mappingService
        .applyMapping(true, this.enabledHarnessElementsCache)
        .map((enabled) => (enabled ? 1 : 0));
      GeometryUtils.applyGeoAttribute(
        geo,
        this.key,
        new Int8BufferAttribute(array, 1)
      );
    }
  }

  public clear() {
    this.enabledHarnessElementsCache.clear();
  }
}
