import { HarnessUtils } from '../utils/harness-utils';
import { GeometryUtils } from '../utils/geometry-utils';
import { ErrorUtils } from '../utils/error-utils';
import {
  Accessory,
  BuildingBlock,
  Connector,
  Fixing,
  FixingAssignment,
  Harness,
  Protection,
  ProtectionArea,
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
  CatmullRomCurve3,
  Quaternion,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { DefaultGeometryCreationService } from './default-geometries.service';

@Injectable({
  providedIn: 'root',
})
export class GeometryService {
  public readonly harnessElementGeos: Map<string, BufferGeometry> = new Map();
  private readonly defaultConnectors: BufferGeometry[];
  private readonly defaultAccessories: BufferGeometry;
  private readonly defaultFixings: BufferGeometry;

  constructor(
    private readonly buildingBlockService: BuildingBlockService,
    private readonly cacheService: CacheService,
    private readonly curveService: CurveService,
    private readonly defaultGeometryCreationService: DefaultGeometryCreationService,
    private readonly loadingService: LoadingService,
    private readonly positionService: PositionService,
    private readonly settingsService: SettingsService
  ) {
    this.defaultConnectors =
      this.defaultGeometryCreationService.connectorSizes();
    this.defaultAccessories = this.defaultGeometryCreationService.accessory();
    this.defaultFixings = this.defaultGeometryCreationService.fixing();
  }

  private processConnector(connector: Connector | null) {
    if (!connector) {
      console.warn(ErrorUtils.isNull('connector'));
      return;
    }
    if (!connector.placement || !connector.geometryPoint) {
      console.warn(ErrorUtils.notPlaced(connector));
      return;
    }

    let index = 0;
    if (connector.numberOfCavities) {
      index = Math.min(Math.floor(connector.numberOfCavities / 10), 2);
    }

    let rotation: Quaternion;
    let position: Vector3;

    switch (this.settingsService.geometryMode) {
      case GeometryModeAPIEnum.default:
        const depth = (this.defaultConnectors[index] as BoxBufferGeometry)
          .parameters.depth;

        position = HarnessUtils.convertPlacementToVector(
          connector.geometryPoint
        );
        const zV =
          connector.segmentDirection !== null
            ? HarnessUtils.convertPlacementToVector(connector.segmentDirection)
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
        rotation = HarnessUtils.computeRotationFromPlacement(
          connector.placement
        );
        position = HarnessUtils.convertPlacementToVector(
          connector.placement.location
        );
        break;
    }

    const defaultGeo = this.defaultConnectors[index];
    const geos = GeometryUtils.createGeo(
      connector,
      defaultGeo,
      this.settingsService,
      this.loadingService
    );
    this.positionService.positionGeometry(position, rotation, geos);
    this.buildingBlockService.applyBuildingBlock(connector.id, geos);

    this.harnessElementGeos.set(connector.id, geos);
    this.cacheService.elementCache.set(connector.id, connector);
  }

  private processAccessory(accessory: Accessory | null) {
    if (!accessory) {
      console.warn(ErrorUtils.isNull('accessory'));
      return;
    }
    if (!accessory.placement || !accessory.placement.location) {
      console.warn(ErrorUtils.notPlaced(accessory));
      return;
    }

    const rotation = HarnessUtils.computeRotationFromPlacement(
      accessory.placement
    );
    const position = HarnessUtils.convertPlacementToVector(
      accessory.placement.location
    );

    const geos = GeometryUtils.createGeo(
      accessory,
      this.defaultAccessories,
      this.settingsService,
      this.loadingService
    );
    this.positionService.positionGeometry(position, rotation, geos);
    this.buildingBlockService.applyBuildingBlock(accessory.id, geos);

    this.harnessElementGeos.set(accessory.id, geos);
    this.cacheService.elementCache.set(accessory.id, accessory);
  }

  private processFixingAssignment(
    assignment: FixingAssignment,
    fixing: Fixing,
    rotation: Quaternion
  ) {
    let position: Vector3 | null = null;
    if (this.settingsService.geometryMode) {
      const cacheElem = this.harnessElementGeos.get(assignment.segmentId);
      if (cacheElem) {
        position = (cacheElem as TubeBufferGeometry).parameters.path.getPoint(
          assignment.location
        );
      }
    } else {
      if (fixing.placement) {
        position = HarnessUtils.convertPlacementToVector(
          fixing.placement.location
        );
      }
    }

    if (position) {
      const geos = GeometryUtils.createGeo(
        fixing,
        this.defaultFixings,
        this.settingsService,
        this.loadingService
      );
      this.positionService.positionGeometry(position, rotation, geos);
      this.buildingBlockService.applyBuildingBlock(fixing.id, geos);
      this.harnessElementGeos.set(fixing.id, geos);
      return geos;
    } else {
      console.warn(`fixing assignment on ${fixing.id}, no position computed`);
      return null;
    }
  }

  private processFixing(fixing: Fixing | null) {
    if (!fixing) {
      console.warn(ErrorUtils.isNull('fixing'));
      return;
    }
    if (!fixing.placement) {
      console.warn(ErrorUtils.notPlaced(fixing));
      return;
    }
    if (
      fixing.fixingAssignments == null ||
      fixing.fixingAssignments.length == 0
    ) {
      console.error(`${fixing.id} has no fixing assignments`);
      return;
    }

    const rotation = HarnessUtils.computeRotationFromPlacement(
      fixing.placement
    );

    if (this.settingsService.geometryMode) {
      const assignmentGeos: BufferGeometry[] = [];
      fixing.fixingAssignments
        .map((assignment) =>
          this.processFixingAssignment(assignment, fixing, rotation)
        )
        .forEach((assignment) => {
          if (assignment) {
            assignmentGeos.push(assignment);
          }
        });
      this.harnessElementGeos.set(
        fixing.id,
        GeometryUtils.mergeGeos(assignmentGeos)
      );
    } else {
      this.processFixingAssignment(
        fixing.fixingAssignments[0],
        fixing,
        rotation
      );
    }

    this.cacheService.elementCache.set(fixing.id, fixing);
  }

  private processSegment(segment: Segment | null) {
    if (!segment) {
      console.warn(ErrorUtils.isNull('segment'));
      return;
    }
    if (!segment.centerCurves) {
      console.error(`${segment.id} has no center curves`);
      return;
    }

    const segmentCurve = this.curveService.createSegmentCurve(
      segment.centerCurves
    );
    const segmentRadius = HarnessUtils.computeRadiusFromCrossSectionArea(
      segment.crossSectionArea
    );

    const geos = this.positionService.positionTubeGeometry(
      segmentCurve,
      segment.virtualLength,
      segmentRadius
    );
    this.buildingBlockService.applyBuildingBlock(segment.id, geos);

    this.harnessElementGeos.set(segment.id, geos);
    this.cacheService.elementCache.set(segment.id, segment);
  }

  private processProtection(protection: Protection | null) {
    if (!protection) {
      console.warn(ErrorUtils.isNull('protection'));
      return;
    }
    if (!protection.protectionAreas) {
      console.error(`${protection.id} has no protection areas`);
      return;
    }

    this.cacheService.elementCache.set(protection.id, protection);
    protection.protectionAreas.forEach((area: any) =>
      this.processSingleProtectionArea(area, protection.id)
    );
  }

  private processSingleProtectionArea(
    protectionArea: ProtectionArea,
    protectionId: string
  ) {
    const segmentGeos = this.harnessElementGeos.get(protectionArea.segmentId);
    if (!segmentGeos) {
      console.warn(ErrorUtils.notFound(protectionArea.segmentId));
      return;
    }
    const segmentGeo = segmentGeos as TubeBufferGeometry;

    const points: Vector3[] = [];
    const stepSize = 1 / protectionArea.length;
    points.push(
      segmentGeo.parameters.path.getPoint(protectionArea.startLocation)
    );
    for (
      let i = protectionArea.startLocation + stepSize;
      i < protectionArea.endLocation;
      i += stepSize
    ) {
      points.push(segmentGeo.parameters.path.getPoint(i));
    }
    points.push(
      segmentGeo.parameters.path.getPoint(protectionArea.endLocation)
    );

    const protectionPath = new CatmullRomCurve3(points);
    const protectionRadius = HarnessUtils.computeDefaultProtectionRadius(
      segmentGeo.parameters.radius
    );

    const geos = this.positionService.positionTubeGeometry(
      protectionPath,
      protectionArea.length,
      protectionRadius
    );
    this.buildingBlockService.applyBuildingBlock(
      protectionArea.segmentId,
      geos
    );

    this.harnessElementGeos.set(protectionId, geos);
  }

  public processHarness(harness: Harness) {
    this.harnessElementGeos.clear();
    if (this.cacheService.harnessMeshCache.has(harness.id)) {
      console.info(`harness ${harness.id} is already loaded`);
      return;
    }
    this.handleBlocks(harness);
    this.loadGeometries(harness);
    this.positionGeometries(harness);
  }

  private handleBlocks(harness: Harness) {
    harness.buildingBlocks.forEach((bb: BuildingBlock) => {
      this.buildingBlockService.fillBuildingBlockMap(bb);
      this.cacheService.elementCache.set(bb.id, bb);
    });
  }

  private loadGeometries(harness: Harness) {
    if (this.settingsService.geometryMode === GeometryModeAPIEnum.loaded) {
      this.loadingService.parseGeometryData(harness.geometries);
    }
  }

  private positionGeometries(harness: Harness) {
    harness.segments.forEach((s: Segment) => this.processSegment(s));
    harness.protections.forEach((p: Protection) => this.processProtection(p));
    harness.fixings.forEach((f: Fixing) => this.processFixing(f));
    harness.connectors.forEach((c: Connector) => this.processConnector(c));
    harness.accessories.forEach((a: Accessory) => this.processAccessory(a));
  }
}
