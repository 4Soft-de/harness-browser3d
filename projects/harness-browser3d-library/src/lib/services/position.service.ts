import { Injectable } from '@angular/core';
import {
  BufferGeometry,
  Curve,
  Matrix4,
  Quaternion,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  constructor(private readonly settingsService: SettingsService) {}

  public positionGeometry(
    position: Vector3,
    rotation: Quaternion,
    geo: BufferGeometry
  ) {
    const matrix = new Matrix4().compose(
      position,
      rotation,
      new Vector3(1, 1, 1)
    );
    geo.applyMatrix4(matrix);
  }

  public positionTubeGeometry(
    curve: Curve<Vector3>,
    length: number,
    radius: number
  ) {
    const geo = new TubeBufferGeometry(
      curve,
      Math.ceil(length * this.settingsService.curveStepsFactor),
      radius,
      this.settingsService.segmentCount,
      false
    );
    GeometryUtils.clean(geo);
    return geo;
  }
}
