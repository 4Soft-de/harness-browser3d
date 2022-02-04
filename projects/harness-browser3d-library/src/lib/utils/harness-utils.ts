import { Matrix4, Quaternion, Vector3 } from 'three';
import {
  Accessory,
  Connector,
  Fixing,
  Harness,
  Placement,
  Point,
  Protection,
  Segment,
} from '../../api/alias';
import { CacheService } from '../services/cache.service';

export class HarnessUtils {
  private static readonly PROTECTION_RADIUS_INCREASE = 1;

  public static getHarnessElementIds(harness: Harness) {
    const elements: string[] = [];
    harness.segments.forEach((s: Segment) => elements.push(s.id));
    harness.protections.forEach((p: Protection) => elements.push(p.id));
    harness.fixings.forEach((f: Fixing) => elements.push(f.id));
    harness.connectors.forEach((c: Connector) => elements.push(c.id));
    harness.accessories.forEach((a: Accessory) => elements.push(a.id));
    return elements;
  }

  public static computeRotationFromPlacement(placement: Placement): Quaternion {
    const yV = this.convertPlacementToVector(placement.u).normalize();
    const zV = this.convertPlacementToVector(placement.v).normalize();
    const xV =
      placement.w == null
        ? yV.clone().cross(zV).normalize()
        : this.convertPlacementToVector(placement.w).normalize();

    return new Quaternion().setFromRotationMatrix(
      new Matrix4().set(
        yV.x,
        zV.x,
        xV.x,
        0,
        yV.y,
        zV.y,
        xV.y,
        0,
        yV.z,
        zV.z,
        xV.z,
        0,
        0,
        0,
        0,
        1
      )
    );
  }

  public static getHarness(
    ids: string[],
    cacheService: CacheService
  ): Harness | undefined {
    if (ids.length) {
      return cacheService.elementHarnessCache.get(ids[0]);
    } else {
      return undefined;
    }
  }

  public static convertPlacementToVector(location: Point): Vector3 {
    return new Vector3(location.x, location.y, location.z);
  }

  public static computeRadiusFromCrossSectionArea(crossSectionArea: number) {
    return Math.sqrt(crossSectionArea / Math.PI);
  }

  public static computeDefaultProtectionRadius(segmentRadius: number) {
    return segmentRadius + this.PROTECTION_RADIUS_INCREASE;
  }
}
