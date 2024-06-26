/*
  Copyright (C) 2024 4Soft GmbH
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
  OnWayPlacement,
  PartType,
  Segment,
  SegmentLocation,
} from '../../api/alias';
import { Injectable } from '@angular/core';
import { GeometryModeAPIEnum } from '../../api/structs';
import { BuildingBlockService } from './building-block.service';
import { PositionService } from './position.service';
import { LoadingService } from './loading.service';
import { CurveService } from './curve.service';
import { SettingsService } from './settings.service';
import { BoxGeometry, BufferGeometry, Curve, Quaternion, Vector3 } from 'three';
import { DefaultGeometryCreationService } from './default-geometries.service';
import {
  getNodeId,
  getOnPointSegmentLocations,
} from '../utils/navigation-utils';
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
    private readonly curveService: CurveService,
    private readonly defaultGeometryCreationService: DefaultGeometryCreationService,
    private readonly loadingService: LoadingService,
    private readonly positionService: PositionService,
    private readonly settingsService: SettingsService,
  ) {
    this.defaultNodes = this.defaultGeometryCreationService.node;
    this.defaultConnectors = this.defaultGeometryCreationService.connectorSizes;
    this.defaultOthers = this.defaultGeometryCreationService.accessory;
    this.defaultFixings = this.defaultGeometryCreationService.fixing;
  }

  public processHarnesses(harnesses: Harness[]): BufferGeometry[] {
    const geos: BufferGeometry[] = [];
    harnesses.forEach((harness) => {
      harness.nodes.forEach((node) => this.nodes.set(node.id, node));
      harness.segments.forEach(this.cacheSegment.bind(this));
      this.handleBlocks(harness);
      this.positionGeometries(harness, geos);
      this.nodes.clear();
      this.segments.clear();
      this.curves.clear();
      this.segmentDirections.clear();
    });
    return geos;
  }

  private cacheSegment(segment: Segment): void {
    this.segments.set(segment.id, segment);
    let segmentCurve: Curve<Vector3> = this.curveService.createSegmentCurve(
      segment.curves,
    );
    const startNode = this.nodes.get(segment.startNodeId)!;
    const endNode = this.nodes.get(segment.endNodeId)!;

    if (HarnessUtils.isCurveInverted(startNode, endNode, segmentCurve)) {
      segmentCurve = new InvertedCurve(segmentCurve);
    }
    this.curves.set(segment.id, segmentCurve);

    if (!this.segmentDirections.has(segment.startNodeId)) {
      const segmentDirection = HarnessUtils.computeSegmentDirection(
        startNode,
        endNode,
        segmentCurve.getTangent(0),
      );
      this.segmentDirections.set(segment.startNodeId, segmentDirection);
    }

    if (!this.segmentDirections.has(segment.endNodeId)) {
      const segmentDirection = HarnessUtils.computeSegmentDirection(
        endNode,
        startNode,
        segmentCurve.getTangent(1),
      );
      this.segmentDirections.set(segment.endNodeId, segmentDirection);
    }
  }

  private handleBlocks(harness: Harness): void {
    harness.buildingBlocks.forEach((bb: BuildingBlock) =>
      this.buildingBlockService.fillBuildingBlockMap(bb),
    );
  }

  private positionGeometries(harness: Harness, result: BufferGeometry[]): void {
    function addGeo(id: string, geo?: BufferGeometry) {
      if (geo) {
        geo.name = id;
        result.push(geo);
      }
    }
    harness.nodes.forEach((node) => {
      addGeo(node.id, this.processNode(node));
    });
    harness.segments.forEach((segment) => {
      addGeo(segment.id, this.processSegment(segment));
    });
    harness.occurrences.forEach((occurrence) => {
      addGeo(occurrence.id, this.processOccurrence(occurrence));
    });
  }

  private processNode(node: Node): BufferGeometry {
    const position = HarnessUtils.convertPointToVector(node.position);

    const geo = GeometryUtils.createGeo(
      node,
      this.defaultNodes,
      this.settingsService,
      this.loadingService,
    );

    this.positionService.positionGeometry(position, new Quaternion(), geo);
    this.buildingBlockService.applyBuildingBlock(node.buildingBlockId, geo);

    return geo;
  }

  private processSegment(segment: Segment): BufferGeometry {
    const segmentCurve = this.curves.get(segment.id)!;

    const segmentRadius = HarnessUtils.computeRadiusFromCrossSectionArea(
      segment.crossSectionArea!,
    );

    const geo = this.positionService.positionTubeGeometry(
      segmentCurve,
      segment.virtualLength!,
      segmentRadius,
    );

    if (geo) {
      this.buildingBlockService.applyBuildingBlock(
        segment.buildingBlockId,
        geo,
      );
    }

    return geo;
  }

  private processOccurrence(occurrence: Occurrence): BufferGeometry {
    switch (PartType[occurrence.partType as keyof typeof PartType]) {
      case PartType.Connector:
        return this.processConnector(occurrence);
      case PartType.Protection:
        return this.processProtection(occurrence);
      case PartType.Fixing:
        return this.processFixing(occurrence);
      case PartType.Other:
        return this.processOther(occurrence);
    }
  }

  private processConnector(connector: Occurrence): BufferGeometry {
    let index = 0;
    if (connector.numberOfCavities) {
      index = Math.min(Math.floor(connector.numberOfCavities / 10), 2);
    }

    const node = this.nodes.get(getNodeId(connector)!)!;
    let position: Vector3 | undefined = undefined;

    let rotation: Quaternion;

    switch (this.settingsService.geometryMode) {
      case GeometryModeAPIEnum.default:
        position = HarnessUtils.convertPointToVector(node.position);

        const depth = (this.defaultConnectors[index] as BoxGeometry).parameters
          .depth;

        const segmentDirection = this.segmentDirections.get(node.id);

        const zV =
          segmentDirection !== undefined
            ? HarnessUtils.convertPointToVector(segmentDirection)
            : new Vector3(0, 0, 0);

        rotation = new Quaternion().setFromUnitVectors(
          new Vector3(0, 0, 1),
          zV,
        );

        const junctionPoint = new Vector3()
          .addVectors(position, new Vector3(0, 0, depth / 2))
          .sub(position)
          .applyQuaternion(rotation);

        position.add(junctionPoint);
        break;
      case GeometryModeAPIEnum.loaded:
        position = this.readGraphicPosition(connector);
        rotation = this.readRotation(connector);
        break;
    }

    const geo = GeometryUtils.createGeo(
      connector,
      this.defaultConnectors[index],
      this.settingsService,
      this.loadingService,
    );

    this.positionService.positionGeometry(position, rotation, geo);
    this.buildingBlockService.applyBuildingBlock(
      connector.buildingBlockId,
      geo,
    );

    return geo;
  }

  private processFixing(fixing: Occurrence): BufferGeometry {
    let geo = GeometryUtils.createGeo(
      fixing,
      this.defaultFixings,
      this.settingsService,
      this.loadingService,
    );

    let geos: BufferGeometry[] = [];
    if (this.settingsService.geometryMode === GeometryModeAPIEnum.default) {
      geos = getOnPointSegmentLocations(fixing).map((location) =>
        this.createFixingDefaultGeo(
          geo.clone(),
          location,
          this.readRotation(fixing),
        ),
      );
      geo.dispose();
      geo = GeometryUtils.mergeGeos(geos);
    } else {
      this.positionService.positionGeometry(
        this.readGraphicPosition(fixing),
        this.readRotation(fixing),
        geo,
      );
    }

    this.buildingBlockService.applyBuildingBlock(fixing.buildingBlockId, geo);
    return geo;
  }

  private createFixingDefaultGeo(
    geo: BufferGeometry,
    location: SegmentLocation,
    rotation: Quaternion,
  ) {
    let ratio =
      location.segmentOffsetLength /
      this.segments.get(location.segmentId)!.virtualLength!;

    if (ratio > 1) {
      ratio = 1;
    }

    if (Anchor[location.anchor as keyof typeof Anchor] === Anchor.FromEndNode) {
      ratio = 1 - ratio;
    }

    this.positionService.positionGeometry(
      this.curves.get(location.segmentId)!.getPoint(ratio),
      rotation,
      geo,
    );

    return geo;
  }

  private processProtection(protection: Occurrence): BufferGeometry {
    const placement = protection.placement as OnWayPlacement;
    const startLocation = placement.startLocation as SegmentLocation;
    const endLocation = placement.endLocation as SegmentLocation;

    if (startLocation.segmentId === endLocation.segmentId) {
      return this.processSingleSegmentProtection(
        startLocation,
        endLocation,
        protection.buildingBlockId,
      );
    } else {
      return this.processMultipleSegmentProtection(
        startLocation,
        endLocation,
        placement.segmentPath,
        protection.buildingBlockId,
      );
    }
  }

  private processSingleSegmentProtection(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation,
    buildingBlockId: string,
  ): BufferGeometry {
    const segment = this.segments.get(startLocation.segmentId)!;
    const curve = this.cropCurve(startLocation, endLocation);
    return this.createProtectionGeometry(
      curve,
      segment.virtualLength!,
      segment.crossSectionArea!,
      buildingBlockId,
    );
  }

  private processMultipleSegmentProtection(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation,
    segmentPath: string[],
    buildingBlockId: string,
  ): BufferGeometry {
    const startSegment = this.segments.get(startLocation.segmentId)!;
    const endSegment = this.segments.get(endLocation.segmentId)!;

    let length = startSegment.virtualLength! + endSegment.virtualLength!;
    let crossSectionArea = Math.max(
      startSegment.crossSectionArea!,
      endSegment.crossSectionArea!,
    );

    const curves: Curve<Vector3>[] = [];

    curves.push(this.handleProtectionEdge(false, startLocation, segmentPath));

    for (let i = 1; i < segmentPath.length - 1; i++) {
      const segmentId = segmentPath[i];
      const curve = this.curves.get(segmentId);
      const segment = this.segments.get(segmentId);
      if (curve && segment) {
        curves.push(curve);
        length += segment.virtualLength!;
        crossSectionArea = Math.max(
          crossSectionArea,
          segment.crossSectionArea!,
        );
      }
    }

    curves.push(this.handleProtectionEdge(true, endLocation, segmentPath));

    return this.createProtectionGeometry(
      this.curveService.mergeCurves(curves),
      length,
      crossSectionArea,
      buildingBlockId,
    );
  }

  private handleProtectionEdge(
    invert: boolean,
    location: SegmentLocation,
    segmentPath: string[],
  ): Curve<Vector3> {
    const segment = this.segments.get(location.segmentId)!;
    const otherSegment = this.segments.get(
      segmentPath[invert ? segmentPath.length - 2 : 1],
    )!;

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
      invert ? location : croppedLocation,
    );
  }

  private cropCurve(
    startLocation: SegmentLocation,
    endLocation: SegmentLocation,
  ): Curve<Vector3> {
    const segment = this.segments.get(startLocation.segmentId)!;
    const curve = this.curves.get(startLocation.segmentId)!;

    const startRatio = HarnessUtils.computeRatio(
      startLocation,
      segment.virtualLength!,
    );

    const endRatio = HarnessUtils.computeRatio(
      endLocation,
      segment.virtualLength!,
    );

    return this.curveService.cutCurve(startRatio, endRatio, curve);
  }

  private createProtectionGeometry(
    curve: Curve<Vector3>,
    length: number,
    crossSectionArea: number,
    buildingBlockId: string,
  ): BufferGeometry {
    const geo = this.positionService.positionTubeGeometry(
      curve,
      length,
      HarnessUtils.computeDefaultProtectionRadius(crossSectionArea),
    );
    this.buildingBlockService.applyBuildingBlock(buildingBlockId, geo);
    return geo;
  }

  private processOther(other: Occurrence): BufferGeometry {
    let position: Vector3 | undefined = undefined;
    switch (this.settingsService.geometryMode) {
      case GeometryModeAPIEnum.default:
        const node = this.nodes.get(getNodeId(other)!)!;
        position = HarnessUtils.convertPointToVector(node.position);
        break;
      case GeometryModeAPIEnum.loaded:
        position = this.readGraphicPosition(other);
        break;
    }

    const geo = GeometryUtils.createGeo(
      other,
      this.defaultOthers,
      this.settingsService,
      this.loadingService,
    );
    this.positionService.positionGeometry(
      position,
      this.readRotation(other),
      geo,
    );
    this.buildingBlockService.applyBuildingBlock(other.buildingBlockId, geo);

    return geo;
  }

  private readGraphicPosition(occurrence: Occurrence): Vector3 {
    return occurrence.graphicPosition !== undefined &&
      occurrence.graphicPosition !== null
      ? HarnessUtils.convertPointToVector(occurrence.graphicPosition)
      : new Vector3(0, 0, 0);
  }

  private readRotation(occurrence: Occurrence): Quaternion {
    return occurrence.rotation !== undefined && occurrence.rotation !== null
      ? HarnessUtils.computeQuaternionFromRotation(occurrence.rotation)
      : new Quaternion();
  }
}
