import { Injectable } from '@angular/core';
import {
  BuildingBlock,
  Curve,
  Graphic,
  Harness,
  Node,
  Occurrence,
  PartType,
  Segment,
  SegmentLocation,
} from '../../api/alias';
import { isOnWayPlacement, isSegmentLocation } from '../../api/predicates';
import {
  getNodeId,
  getOnPointSegmentLocations,
} from '../utils/navigation-utils';

@Injectable()
export class PreprocessService {
  private readonly buildingBlocks = new Set<string>();
  private readonly nodes = new Set<string>();
  private readonly segments = new Set<string>();
  private readonly occurrences = new Set<string>();

  public preprocessHarnesses(harnesses: Harness[]): Harness[] {
    return harnesses.map(this.preprocessHarness.bind(this));
  }

  private preprocessHarness(harness: Harness): Harness {
    const result = {
      id: harness.id,
      buildingBlocks: harness.buildingBlocks.map(
        this.preprocessBuildingBlock.bind(this),
      ),
      nodes: harness.nodes.filter(this.preprocessNode.bind(this)),
      segments: harness.segments.filter(this.preprocessSegment.bind(this)),
      occurrences: harness.occurrences.filter(
        this.preprocessOccurrence.bind(this),
      ),
      graphics: harness.graphics?.filter(this.preprocessGraphic.bind(this)),
    };
    this.buildingBlocks.clear();
    this.nodes.clear();
    this.segments.clear();
    this.occurrences.clear();
    return result;
  }

  private preprocessBuildingBlock(buildingBlock: BuildingBlock): BuildingBlock {
    const idDefined = this.defined(buildingBlock, 'id', 'buildingBlock');
    if (idDefined) {
      this.buildingBlocks.add(buildingBlock.id);
    }
    return {
      id: buildingBlock.id,
      position: this.defined(buildingBlock, 'position', 'buildingBlock')
        ? buildingBlock.position
        : { x: 0, y: 0, z: 0 },
      rotation: this.defined(buildingBlock, 'rotation', 'buildingBlock')
        ? buildingBlock.rotation
        : { matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
    };
  }

  private preprocessNode(node: Node): boolean {
    const defined = this.defined(
      node,
      ['id', 'position', 'buildingBlockId'],
      'node',
    );
    if (!defined) {
      return false;
    }

    const correct = this.correctBuildingBlock(
      node.id,
      node.buildingBlockId,
      'node',
    );
    if (correct) {
      this.nodes.add(node.id);
    }
    return correct;
  }

  private preprocessSegment(segment: Segment): boolean {
    const defined = this.defined(
      segment,
      [
        'id',
        'virtualLength',
        'crossSectionArea',
        'curves',
        'startNodeId',
        'endNodeId',
        'buildingBlockId',
      ],
      'segment',
    );
    if (!defined) {
      return false;
    }

    const correct =
      this.correctBuildingBlock(
        segment.id,
        segment.buildingBlockId,
        'segment',
      ) &&
      this.correctNode(segment.id, segment.startNodeId, 'segment') &&
      this.correctNode(segment.id, segment.endNodeId, 'segment') &&
      this.correctLength(
        segment.virtualLength!,
        `segment ${segment.id} has virtualLength ${segment.virtualLength}`,
      ) &&
      this.correctLength(
        segment.crossSectionArea!,
        `segment ${segment.id} has crossSectionArea ${segment.crossSectionArea}`,
      ) &&
      this.preprocessCurves(segment, segment.curves);

    if (correct) {
      this.segments.add(segment.id);
    }
    return correct;
  }

  private preprocessCurves(segment: Segment, curves: Curve[]): boolean {
    if (curves.length === 0) {
      console.warn(`segment ${segment.id} has no curves`);
      return false;
    }

    let allCurvesCorrect = curves
      .map((curve) => {
        if (curve.controlPoints.length === 0) {
          console.warn(
            `segment ${segment.id} has a curve with no control points`,
          );
          return false;
        }
        return true;
      })
      .reduce((pre, next) => pre && next, true);
    return allCurvesCorrect;
  }

  private preprocessOccurrence(occurrence: Occurrence): boolean {
    const defined =
      this.defined(
        occurrence,
        ['id', 'partType', 'partNumber', 'placement', 'buildingBlockId'],
        'occurrence',
      ) &&
      this.correctBuildingBlock(
        occurrence.id,
        occurrence.buildingBlockId,
        'occurrence',
      );
    if (!defined) {
      return false;
    }

    const correct = this.preprocessOccurrencePartType(occurrence);
    if (correct) {
      this.occurrences.add(occurrence.partNumber!);
    }
    return correct;
  }

  private preprocessOccurrencePartType(occurrence: Occurrence): boolean {
    switch (PartType[occurrence.partType as keyof typeof PartType]) {
      case PartType.Connector:
        return this.preprocessConnector(occurrence);
      case PartType.Protection:
        return this.preprocessProtection(occurrence);
      case PartType.Fixing:
        return this.preprocessFixing(occurrence);
      case PartType.Other:
        return this.preprocessOther(occurrence);
      default:
        return false;
    }
  }

  private preprocessConnector(occurrence: Occurrence): boolean {
    const nodeId = getNodeId(occurrence);
    return (
      nodeId !== undefined &&
      this.correctNode(occurrence.id, nodeId, 'connector')
    );
  }

  private preprocessProtection(occurrence: Occurrence): boolean {
    const placement = occurrence.placement;
    if (
      !isOnWayPlacement(placement) ||
      !isSegmentLocation(placement.startLocation) ||
      !isSegmentLocation(placement.endLocation)
    ) {
      console.warn(
        `protection ${occurrence.id} does not have an OnWayPlacement with SegmentLocations`,
      );
      return false;
    }

    const startLocation = placement.startLocation as SegmentLocation;
    const endLocation = placement.endLocation as SegmentLocation;
    if (
      placement.segmentPath.length === 0 ||
      placement.segmentPath[0] !== startLocation.segmentId ||
      placement.segmentPath[placement.segmentPath.length - 1] !==
        endLocation.segmentId
    ) {
      console.warn(
        `protection ${occurrence.id} has incorrect segment path ${placement.segmentPath}`,
      );
      return false;
    }

    const correctPath = placement.segmentPath
      .map((segmentId) =>
        this.correctSegment(occurrence.id, segmentId, 'protection'),
      )
      .reduce((pre, next) => pre && next, true);

    return (
      this.correctLength(
        startLocation.segmentOffsetLength,
        `protection ${occurrence.id} has segmentOffsetLength ${startLocation.segmentOffsetLength}`,
      ) &&
      this.correctLength(
        endLocation.segmentOffsetLength,
        `protection ${occurrence.id} has segmentOffsetLength ${endLocation.segmentOffsetLength}`,
      ) &&
      this.correctSegment(
        occurrence.id,
        startLocation.segmentId,
        'protection',
      ) &&
      this.correctSegment(occurrence.id, endLocation.segmentId, 'protection') &&
      correctPath
    );
  }

  private preprocessFixing(occurrence: Occurrence): boolean {
    const segmentLocations = getOnPointSegmentLocations(occurrence);
    if (segmentLocations.length === 0) {
      console.warn(
        `fixing ${occurrence.id} does not have OnPointPlacements with SegmentLocations`,
      );
      return false;
    }

    const allSegmentsCorrect = segmentLocations
      .map((segmentLocation) =>
        this.correctSegment(occurrence.id, segmentLocation.segmentId, 'fixing'),
      )
      .reduce((pre, next) => pre && next, true);
    return allSegmentsCorrect;
  }

  private preprocessOther(occurrence: Occurrence): boolean {
    const nodeId = getNodeId(occurrence);
    return (
      nodeId !== undefined && this.correctNode(occurrence.id, nodeId, 'other')
    );
  }

  private preprocessGraphic(graphic: Graphic): boolean {
    const defined = this.defined(graphic, ['partNumber', 'data'], 'graphic');
    if (!defined) {
      return false;
    }
    return this.correctGraphic(graphic.partNumber);
  }

  private defined(
    object: any,
    key: string[] | string,
    prefix: string,
  ): boolean {
    const keys = typeof key === 'string' ? [key] : key;
    return keys
      .map((key) => {
        const property = object[key];
        const defined = property !== undefined && property !== null;
        if (!defined) {
          console.warn(`${prefix} ${object.id} does not have ${key}`);
        }
        return defined;
      })
      .reduce((pre, next) => pre && next, true);
  }

  private correctBuildingBlock(
    id: string,
    buildingBlockId: string,
    prefix: string,
  ): boolean {
    const correct = this.buildingBlocks.has(buildingBlockId);
    if (!correct) {
      console.warn(
        `${prefix} ${id} has non existent or invalid building block ${buildingBlockId}`,
      );
    }
    return correct;
  }

  private correctNode(id: string, nodeId: string, prefix: string): boolean {
    const correct = this.nodes.has(nodeId);
    if (!correct) {
      console.warn(
        `${prefix} ${id} has non existent or invalid node ${nodeId}`,
      );
    }
    return correct;
  }

  private correctSegment(
    id: string,
    segmentId: string,
    prefix: string,
  ): boolean {
    const correct = this.segments.has(segmentId);
    if (!correct) {
      console.warn(
        `${prefix} ${id} has non existent or invalid segment ${segmentId}`,
      );
    }
    return correct;
  }

  private correctLength(length: number, warn: string) {
    if (length < 0) {
      console.warn(warn);
      return false;
    }
    return true;
  }

  private correctGraphic(partNumber: string): boolean {
    const correct = this.occurrences.has(partNumber);
    if (!correct) {
      console.warn(`graphic for part number ${partNumber} is not needed`);
    }
    return correct;
  }
}
