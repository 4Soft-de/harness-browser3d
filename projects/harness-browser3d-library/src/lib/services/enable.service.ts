import { Injectable } from '@angular/core';
import { Int8BufferAttribute, Mesh } from 'three';
import { ErrorUtils } from '../utils/error-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { CacheService } from './cache.service';
import { MappingService } from './mapping.service';

@Injectable()
export class EnableService {
  private readonly key = 'pEnabled';
  private readonly enabledHarnessElementsCache = new Map<
    string,
    Map<string, boolean>
  >();

  constructor(
    private readonly cacheService: CacheService,
    private readonly mappingService: MappingService
  ) {}

  public enableElements(ids: string[]): void {
    this.enableElementsImplementation(ids, true);
  }

  public disableElements(ids: string[]): void {
    this.enableElementsImplementation(ids, false);
  }

  public enableAll(harnessId: string) {
    const mesh = this.cacheService.harnessMeshCache.get(harnessId);
    const harness = this.cacheService.harnessCache.get(harnessId);
    let map = this.enabledHarnessElementsCache.get(harnessId);
    if (!map) {
      map = new Map<string, boolean>();
      this.enabledHarnessElementsCache.set(harnessId, map);
    }
    if (mesh && harness) {
      harness.nodes.forEach((node) => map!.set(node.id, true));
      harness.segments.forEach((segment) => map!.set(segment.id, true));
      harness.occurrences.forEach((occurrence) =>
        map!.set(occurrence.id, true)
      );
      this.applyEnabled(harnessId, mesh);
    } else {
      console.error(ErrorUtils.notFound(harnessId));
    }
  }

  private enableElementsImplementation(ids: string[], enabled: boolean) {
    const harnessId = this.cacheService.harnessElementIdHarnessIdCache.get(
      ids[0]
    );
    if (harnessId) {
      let map = this.enabledHarnessElementsCache.get(harnessId);
      const mesh = this.cacheService.harnessMeshCache.get(harnessId);
      if (map && mesh) {
        ids.forEach((id) => map!.set(id, enabled));
        this.applyEnabled(harnessId, mesh);
      } else {
        console.error(ErrorUtils.notFound(harnessId));
      }
    } else {
      console.error(`harness for ${ids[0]} not found`);
    }
  }

  private applyEnabled(harnessId: string, mesh: Mesh) {
    const input = this.enabledHarnessElementsCache.get(harnessId);
    if (input) {
      const array = this.mappingService
        .applyMapping(harnessId, true, input)
        .map((enabled) => (enabled ? 1 : 0));
      GeometryUtils.applyGeoAttribute(
        mesh.geometry,
        this.key,
        new Int8BufferAttribute(array, 1)
      );
    }
  }
}
