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

import { HarnessUtils } from '../utils/harness-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import {
  Anchor,
  BuildingBlock,
  Harness,
  Location,
  Node,
  Occurrence,
  PartType,
  Segment,
} from '../../api/alias';
import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { GeometryModeAPIEnum } from '../../api/structs';
import { BuildingBlockService } from './building-block.service';
import { PositionService } from './position.service';
import { LoadingService } from './loading.service';
import { CurveService } from './curve.service';
import { SettingsService } from './settings.service';
import {
  BoxBufferGeometry,
  BufferGeometry,
  Curve,
  CurvePath,
  Quaternion,
  Vector3,
} from 'three';
import { DefaultGeometryCreationService } from './default-geometries.service';
import { getNodeId, getSegmentLocations } from '../utils/navigation-utils';
import { isOnWayPlacement, isSegmentLocation } from '../../api/predicates';

@Injectable()
export class GeometryService {
  private readonly defaultNodes: BufferGeometry;
  private readonly defaultConnectors: BufferGeometry[];
  private readonly defaultOthers: BufferGeometry;
  private readonly defaultFixings: BufferGeometry;

  private readonly nodes: Map<string, Node> = new Map();
  private readonly segments: Map<string, Segment> = new Map();
  private readonly curves: Map<string, CurvePath<Vector3>> = new Map();
  private readonly segmentDirections: Map<string, Vector3> = new Map();

  constructor(
    private readonly buildingBlockService: BuildingBlockService,
    private readonly cacheService: CacheService,
    private readonly curveService: CurveService,
    private readonly defaultGeometryCreationService: DefaultGeometryCreationService,
    private readonly loadingService: LoadingService,
    private readonly positionService: PositionService,
    private readonly settingsService: SettingsService
  ) {
    this.defaultNodes = this.defaultGeometryCreationService.node();
    this.defaultConnectors =
      this.defaultGeometryCreationService.connectorSizes();
    this.defaultOthers = this.defaultGeometryCreationService.accessory();
    this.defaultFixings = this.defaultGeometryCreationService.fixing();
  }

  public processHarness(harness: Harness): Map<string, BufferGeometry> {
    if (this.cacheService.harnessMeshCache.has(harness.id)) {
      console.info(`harness ${harness.id} is already loaded`);
      return new Map();
    }

    harness.nodes.forEach((node) => this.nodes.set(node.id, node));
    harness.segments.forEach(this.cacheSegment.bind(this));

    this.handleBlocks(harness);
    this.loadGeometries(harness);

    const geos = this.positionGeometries(harness);

    this.nodes.clear();
    this.segments.clear();
    this.curves.clear();
    this.segmentDirections.clear();

    return geos;
  }

  private cacheSegment(segment: Segment): void {
    this.segments.set(segment.id, segment);
    const segmentCurve = this.curveService.createSegmentCurve(segment.curves);
    this.curves.set(segment.id, segmentCurve);
    if (!this.segmentDirections.has(segment.startNodeId)) {
      this.segmentDirections.set(
        segment.startNodeId,
        this.computeSegmentDirection(false, segment)
      );
    }
    if (!this.segmentDirections.has(segment.endNodeId)) {
      this.segmentDirections.set(
        segment.endNodeId,
        this.computeSegmentDirection(true, segment)
      );
    }
  }

  private computeSegmentDirection(invert: boolean, segment: Segment): Vector3 {
    const direction = this.curves.get(segment.id)!.getTangent(invert ? 1 : 0);
    const nodeA = this.nodes.get(
      invert ? segment.endNodeId : segment.startNodeId
    );
    const nodeB = this.nodes.get(
      invert ? segment.startNodeId : segment.endNodeId
    );
    if (!nodeA || !nodeB) {
      return direction;
    }
    const nodeAPosition = HarnessUtils.convertPointToVector(nodeA.position);
    const nodeBPosition = HarnessUtils.convertPointToVector(nodeB.position);
    if (
      nodeAPosition.clone().add(direction).distanceTo(nodeBPosition) <
      nodeAPosition.distanceTo(nodeBPosition)
    ) {
      direction.multiplyScalar(-1);
    }
    return direction;
  }

  private handleBlocks(harness: Harness): void {
    harness.buildingBlocks.forEach((bb: BuildingBlock) =>
      this.buildingBlockService.fillBuildingBlockMap(bb)
    );
  }

  private loadGeometries(harness: Harness): void {
    if (
      this.settingsService.geometryMode === GeometryModeAPIEnum.loaded &&
      harness.graphics
    ) {
      this.loadingService.parseGeometryData(harness.graphics);
    }
  }

  private positionGeometries(harness: Harness): Map<string, BufferGeometry> {
    const harnessElementGeos: Map<string, BufferGeometry> = new Map();
    harness.nodes.forEach((node) => {
      harnessElementGeos.set(node.id, this.processNode(node));
    });
    harness.segments.forEach((segment) => {
      const geo = this.processSegment(segment);
      if (geo) {
        harnessElementGeos.set(segment.id, geo);
      }
    });
    harness.occurrences.forEach((occurrence) => {
      const geo = this.processOccurrence(occurrence);
      if (geo) {
        harnessElementGeos.set(occurrence.id, geo);
      }
    });
    return harnessElementGeos;
  }

  private processNode(node: Node): BufferGeometry {
    const position = HarnessUtils.convertPointToVector(node.position);

    const geo = GeometryUtils.createGeo(
      node,
      this.defaultNodes,
      this.settingsService,
      this.loadingService
    );

    this.positionService.positionGeometry(position, new Quaternion(), geo);
    this.buildingBlockService.applyBuildingBlock(node.buildingBlockId, geo);

    return geo;
  }

  private processSegment(segment: Segment): BufferGeometry | undefined {
    const segmentCurve = this.curves.get(segment.id);
    if (!segmentCurve) {
      return undefined;
    }

    const segmentRadius = HarnessUtils.computeRadiusFromCrossSectionArea(
      segment.crossSectionArea
    );

    const geo = this.positionService.positionTubeGeometry(
      segmentCurve,
      segment.virtualLength,
      segmentRadius
    );

    this.buildingBlockService.applyBuildingBlock(segment.buildingBlockId, geo);

    return geo;
  }

  private processOccurrence(
    occurrence: Occurrence
  ): BufferGeometry | undefined {
    switch (PartType[occurrence.partType as keyof typeof PartType]) {
      case PartType.Connector:
        return this.processConnector(occurrence);
      case PartType.Protection:
        return this.processProtection(occurrence);
      case PartType.Fixing:
        return this.processFixing(occurrence);
      case PartType.Other:
        return this.processOther(occurrence);
      default:
        return undefined;
    }
  }

  private processConnector(connector: Occurrence): BufferGeometry | undefined {
    let index = 0;
    if (connector.numberOfCavities) {
      index = Math.min(Math.floor(connector.numberOfCavities / 10), 2);
    }

    const node = this.getNode(connector);
    if (!node) {
      return undefined;
    }
    const position = HarnessUtils.convertPointToVector(node.position);

    let rotation: Quaternion;

    switch (this.settingsService.geometryMode) {
      case GeometryModeAPIEnum.default:
        const depth = (this.defaultConnectors[index] as BoxBufferGeometry)
          .parameters.depth;

        const segmentDirection = this.segmentDirections.get(node.id);

        const zV =
          segmentDirection !== undefined
            ? HarnessUtils.convertPointToVector(segmentDirection)
            : new Vector3(0, 0, 0);

        rotation = new Quaternion().setFromUnitVectors(
          new Vector3(0, 0, 1),
          zV
        );

        const junctionPoint = new Vector3()
          .addVectors(position, new Vector3(0, 0, depth / 2))
          .sub(position)
          .applyQuaternion(rotation);

        position.add(junctionPoint);
        break;
      case GeometryModeAPIEnum.loaded:
        rotation =
          connector.rotation !== undefined
            ? HarnessUtils.computeQuaternionFromRotation(connector.rotation)
            : new Quaternion();
        const offset =
          connector.positionOffset !== undefined
            ? HarnessUtils.convertPointToVector(connector.positionOffset)
            : new Vector3(0, 0, 0);
        position.add(offset);
        break;
    }

    const geo = GeometryUtils.createGeo(
      connector,
      this.defaultConnectors[index],
      this.settingsService,
      this.loadingService
    );

    this.positionService.positionGeometry(position, rotation, geo);
    this.buildingBlockService.applyBuildingBlock(
      connector.buildingBlockId,
      geo
    );

    return geo;
  }

  private processFixing(fixing: Occurrence): BufferGeometry | undefined {
    const rotation =
      fixing.rotation !== undefined
        ? HarnessUtils.computeQuaternionFromRotation(fixing.rotation)
        : new Quaternion();

    const geos = getSegmentLocations(fixing)
      .filter(
        (location) =>
          this.curves.has(location.segmentId) &&
          this.segments.has(location.segmentId)
      )
      .map((location) => {
        let ratio =
          location.segmentOffsetLength /
          this.segments.get(location.segmentId)!.virtualLength;
        if (
          Anchor[location.anchor as keyof typeof Anchor] === Anchor.FromEndNode
        ) {
          ratio = 1 - ratio;
        }
        const geo = GeometryUtils.createGeo(
          fixing,
          this.defaultFixings,
          this.settingsService,
          this.loadingService
        );
        this.positionService.positionGeometry(
          this.curves.get(location.segmentId)!.getPoint(ratio),
          rotation,
          geo
        );
        this.buildingBlockService.applyBuildingBlock(
          fixing.buildingBlockId,
          geo
        );
        return geo;
      });

    return GeometryUtils.mergeGeos(geos);
  }

  private processProtection(
    protection: Occurrence
  ): BufferGeometry | undefined {
    const placement = protection.placement;
    if (!isOnWayPlacement(placement)) {
      return undefined;
    }

    const geos: BufferGeometry[] = [];

    const startGeo = this.handleProtectionEdge(placement.startLocation, false);
    if (startGeo) {
      geos.push(startGeo);
    }

    for (let i = 1; i < placement.segmentPath.length - 1; i++) {
      const segmentId = placement.segmentPath[i];
      const segment = this.segments.get(segmentId);
      const curve = this.curves.get(segmentId);
      if (segment && curve) {
        geos.push(this.createProtectionGeometry(curve, segment));
      }
    }

    const endGeo = this.handleProtectionEdge(placement.endLocation, true);
    if (endGeo) {
      geos.push(endGeo);
    }

    return GeometryUtils.mergeGeos(geos);
  }

  private handleProtectionEdge(
    location: Location,
    invert: boolean
  ): BufferGeometry | undefined {
    if (!isSegmentLocation(location)) {
      return undefined;
    }
    const segment = this.segments.get(location.segmentId);
    if (!segment) {
      return undefined;
    }
    const curve = this.curves.get(location.segmentId);
    if (!curve) {
      return undefined;
    }

    let startRatio = invert
      ? 0
      : location.segmentOffsetLength / segment.virtualLength;
    let endRatio = invert
      ? location.segmentOffsetLength / segment.virtualLength
      : 1;
    if (Anchor[location.anchor as keyof typeof Anchor] === Anchor.FromEndNode) {
      endRatio = 1 - endRatio;
    }
    const croppedCurve = this.curveService.cutCurve(
      startRatio,
      endRatio,
      curve
    );

    return this.createProtectionGeometry(croppedCurve, segment);
  }

  private createProtectionGeometry(curve: Curve<Vector3>, segment: Segment) {
    const geo = this.positionService.positionTubeGeometry(
      curve,
      segment.virtualLength,
      HarnessUtils.computeDefaultProtectionRadius(segment.crossSectionArea)
    );
    this.buildingBlockService.applyBuildingBlock(segment.buildingBlockId, geo);
    return geo;
  }

  private processOther(other: Occurrence): BufferGeometry | undefined {
    const rotation =
      other.rotation !== undefined
        ? HarnessUtils.computeQuaternionFromRotation(other.rotation)
        : new Quaternion();

    const node = this.getNode(other);
    if (!node) {
      return undefined;
    }

    const offset =
      other.positionOffset !== undefined
        ? HarnessUtils.convertPointToVector(other.positionOffset)
        : new Vector3(0, 0, 0);
    const position = HarnessUtils.convertPointToVector(node.position).add(
      offset
    );

    const geo = GeometryUtils.createGeo(
      other,
      this.defaultOthers,
      this.settingsService,
      this.loadingService
    );
    this.positionService.positionGeometry(position, rotation, geo);
    this.buildingBlockService.applyBuildingBlock(other.buildingBlockId, geo);

    return geo;
  }

  private getNode(occurrence: Occurrence): Node | undefined {
    const nodeId = getNodeId(occurrence);
    if (!nodeId) {
      return undefined;
    }
    return this.nodes.get(nodeId);
  }
}
