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
  Node,
  Occurrence,
  PartType,
  Segment,
  SegmentLocation,
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
  Quaternion,
  Vector3,
} from 'three';
import { DefaultGeometryCreationService } from './default-geometries.service';
import {
  getNodeId,
  getOnPointSegmentLocations,
} from '../utils/navigation-utils';
import { isOnWayPlacement, isSegmentLocation } from '../../api/predicates';
import { InvertedCurve } from '../structs/inverted-curve';

@Injectable()
export class GeometryService {
  private readonly defaultNodes: BufferGeometry;
  private readonly defaultConnectors: BufferGeometry[];
  private readonly defaultOthers: BufferGeometry;
  private readonly defaultFixings: BufferGeometry;

  private readonly nodes: Map<string, Node> = new Map();
  private readonly segments: Map<string, Segment> = new Map();
  private readonly curves: Map<string, Curve<Vector3>> = new Map();
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
    let segmentCurve: Curve<Vector3> | undefined =
      this.curveService.createSegmentCurve(segment.curves);
    const startNode = this.nodes.get(segment.startNodeId);
    const endNode = this.nodes.get(segment.endNodeId);

    if (!segmentCurve || !startNode || !endNode) {
      return undefined;
    }

    if (HarnessUtils.isCurveInverted(startNode, endNode, segmentCurve)) {
      segmentCurve = new InvertedCurve(segmentCurve);
    }
    this.curves.set(segment.id, segmentCurve);

    if (!this.segmentDirections.has(segment.startNodeId)) {
      const segmentDirection = HarnessUtils.computeSegmentDirection(
        startNode,
        endNode,
        segmentCurve.getTangent(0)
      );
      this.segmentDirections.set(segment.startNodeId, segmentDirection);
    }

    if (!this.segmentDirections.has(segment.endNodeId)) {
      const segmentDirection = HarnessUtils.computeSegmentDirection(
        endNode,
        startNode,
        segmentCurve.getTangent(1)
      );
      this.segmentDirections.set(segment.endNodeId, segmentDirection);
    }
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
    if (
      !segmentCurve ||
      !this.nodes.has(segment.startNodeId) ||
      !this.nodes.has(segment.endNodeId)
    ) {
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

    if (geo) {
      this.buildingBlockService.applyBuildingBlock(
        segment.buildingBlockId,
        geo
      );
    }

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

    const geos = getOnPointSegmentLocations(fixing)
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
    if (
      !isOnWayPlacement(placement) ||
      !isSegmentLocation(placement.startLocation) ||
      !isSegmentLocation(placement.endLocation) ||
      placement.segmentPath.length === 0 ||
      placement.segmentPath[0] !== placement.startLocation.segmentId ||
      placement.segmentPath[placement.segmentPath.length - 1] !==
        placement.endLocation.segmentId
    ) {
      return undefined;
    }

    if (placement.startLocation.segmentId === placement.endLocation.segmentId) {
      return this.processSingleSegmentProtection(
        placement.startLocation,
        placement.endLocation,
        protection.buildingBlockId
      );
    } else {
      return this.processMultipleSegmentProtection(
        placement.startLocation,
        placement.endLocation,
        placement.segmentPath,
        protection.buildingBlockId
      );
    }
  }

  private processSingleSegmentProtection(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation,
    buildingBlockId: string
  ): BufferGeometry | undefined {
    const segment = this.segments.get(startLocation.segmentId);
    const curve = this.cropCurve(startLocation, endLocation);
    if (!segment || !curve) {
      return undefined;
    }
    return this.createProtectionGeometry(
      curve,
      segment.virtualLength,
      segment.crossSectionArea,
      buildingBlockId
    );
  }

  private processMultipleSegmentProtection(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation,
    segmentPath: string[],
    buildingBlockId: string
  ) {
    const startSegment = this.segments.get(startLocation.segmentId);
    const endSegment = this.segments.get(endLocation.segmentId);
    if (!startSegment || !endSegment) {
      return undefined;
    }

    let length = startSegment.virtualLength + endSegment.virtualLength;
    let radius = Math.max(
      startSegment.crossSectionArea,
      endSegment.crossSectionArea
    );

    const curves: Curve<Vector3>[] = [];

    const startCurve = this.handleProtectionEdge(
      false,
      startLocation,
      segmentPath
    );
    if (startCurve) {
      curves.push(startCurve);
    }

    for (let i = 1; i < segmentPath.length - 1; i++) {
      const segmentId = segmentPath[i];
      const curve = this.curves.get(segmentId);
      const segment = this.segments.get(segmentId);
      if (curve && segment) {
        curves.push(curve);
        length += segment.virtualLength;
        radius = Math.max(radius, segment.crossSectionArea);
      }
    }

    const endCurve = this.handleProtectionEdge(true, endLocation, segmentPath);
    if (endCurve) {
      curves.push(endCurve);
    }

    if (curves.length === 0) {
      return undefined;
    }

    return this.createProtectionGeometry(
      this.curveService.mergeCurves(curves),
      length,
      radius,
      buildingBlockId
    );
  }

  private handleProtectionEdge(
    invert: boolean,
    location: SegmentLocation,
    segmentPath: string[]
  ): Curve<Vector3> | undefined {
    const segment = this.segments.get(location.segmentId);
    const otherSegment = this.segments.get(
      segmentPath[invert ? segmentPath.length - 2 : 1]
    );
    if (!segment || !otherSegment) {
      return undefined;
    }

    const anchor =
      segment.endNodeId === otherSegment.startNodeId
        ? Anchor.FromEndNode
        : Anchor.FromStartNode;
    const invertedAnchor =
      segment.startNodeId === otherSegment.endNodeId
        ? Anchor.FromStartNode
        : Anchor.FromEndNode;

    const croppedLocation = {
      segmentId: segment.id,
      anchor: (invert ? invertedAnchor : anchor).toString(),
      segmentOffsetLength: 0,
    } as SegmentLocation;
    return this.cropCurve(
      invert ? croppedLocation : location,
      invert ? location : croppedLocation
    );
  }

  private cropCurve(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation
  ): Curve<Vector3> | undefined {
    const segment = this.segments.get(startLocation.segmentId);
    const curve = this.curves.get(startLocation.segmentId);

    if (
      startLocation.segmentId !== endLocation.segmentId ||
      !segment ||
      !curve
    ) {
      return undefined;
    }

    const startRatio = HarnessUtils.computeRatio(
      startLocation,
      segment.virtualLength
    );

    const endRatio = HarnessUtils.computeRatio(
      endLocation,
      segment.virtualLength
    );

    if (startRatio === undefined || endRatio === undefined) {
      return undefined;
    }

    return this.curveService.cutCurve(startRatio, endRatio, curve);
  }

  private createProtectionGeometry(
    curve: Curve<Vector3>,
    length: number,
    radius: number,
    buildingBlockId: string
  ): BufferGeometry | undefined {
    const geo = this.positionService.positionTubeGeometry(
      curve,
      length,
      HarnessUtils.computeDefaultProtectionRadius(radius)
    );
    if (geo) {
      this.buildingBlockService.applyBuildingBlock(buildingBlockId, geo);
    }
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
