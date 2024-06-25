import { Injectable } from '@angular/core';
import { Int8BufferAttribute } from 'three';
import { Harness, Occurrence, Segment, Node } from '../../api/alias';
import { DiffStateAPIEnum } from '../../api/structs';
import { GeometryUtils } from '../utils/geometry-utils';
import { BordnetMeshService } from './bordnet-mesh.service';
import { MappingService } from './mapping.service';

@Injectable()
export class DiffService {
  private readonly propertyKey = 'diffState';
  private readonly shaderKey = 'pDiffState';

  constructor(
    private readonly bordnetMeshService: BordnetMeshService,
    private readonly mappingService: MappingService,
  ) {}

  public applyDiffState(harnesses: Harness[]) {
    const geo = this.bordnetMeshService.getBordnetGeo();
    if (geo) {
      const map = this.createDiffStateMapping(harnesses);
      const array = this.mappingService.applyMapping(
        DiffStateAPIEnum.unmodified,
        map,
      );
      GeometryUtils.applyGeoAttribute(
        geo,
        this.shaderKey,
        new Int8BufferAttribute(array, 1),
      );
    }
  }

  private createDiffStateMapping(
    harnesses: Harness[],
  ): Map<string, DiffStateAPIEnum> {
    const map = new Map<string, DiffStateAPIEnum>();
    harnesses.forEach((harness) => {
      harness.nodes.forEach((node) =>
        map.set(node.id, this.readDiffState(node)),
      );
      harness.segments.forEach((segment) =>
        map.set(segment.id, this.readDiffState(segment)),
      );
      harness.occurrences.forEach((occurrence) =>
        map.set(occurrence.id, this.readDiffState(occurrence)),
      );
    });
    return map;
  }

  private readDiffState(
    harnessElement: Node | Segment | Occurrence,
  ): DiffStateAPIEnum {
    let result = DiffStateAPIEnum.unmodified;
    if (harnessElement.viewProperties) {
      const stateString = harnessElement.viewProperties[this.propertyKey];
      result = this.getDiffState(stateString) ?? DiffStateAPIEnum.unmodified;
    }
    return result;
  }

  private getDiffState(property: string): DiffStateAPIEnum | undefined {
    if (property === 'unmodified') {
      return DiffStateAPIEnum.unmodified;
    }
    if (property === 'added') {
      return DiffStateAPIEnum.added;
    }
    if (property === 'removed') {
      return DiffStateAPIEnum.removed;
    }
    if (property === 'modified_new') {
      return DiffStateAPIEnum.modified_new;
    }
    if (property === 'modified_old') {
      return DiffStateAPIEnum.modified_old;
    }
    return undefined;
  }
}
