import { Injectable } from '@angular/core';
import {
  BoxBufferGeometry,
  CylinderBufferGeometry,
  MathUtils,
  SphereBufferGeometry,
} from 'three';
import { GeometryUtils } from '../utils/geometry-utils';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class DefaultGeometryCreationService {
  constructor(private readonly settingsService: SettingsService) {}

  connectorSizes() {
    const connectorSizes = [
      new BoxBufferGeometry(40, 10, 10, 1),
      new BoxBufferGeometry(30, 10, 10, 1),
      new BoxBufferGeometry(20, 10, 10, 1),
    ];
    connectorSizes.forEach((connector) => GeometryUtils.clean(connector));
    return connectorSizes;
  }

  accessory() {
    const accessory = new CylinderBufferGeometry(
      10,
      10,
      20,
      this.settingsService.segmentCount
    ).rotateX(MathUtils.degToRad(90));
    GeometryUtils.clean(accessory);
    return accessory;
  }

  fixing() {
    const fixing = new SphereBufferGeometry(
      10,
      this.settingsService.segmentCount,
      this.settingsService.segmentCount
    );
    GeometryUtils.clean(fixing);
    return fixing;
  }
}
