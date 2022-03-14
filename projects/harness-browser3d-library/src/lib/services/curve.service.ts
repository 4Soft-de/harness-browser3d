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

import { Injectable } from '@angular/core';
import { NURBSCurve } from 'three/examples/jsm/curves/NURBSCurve';
import { CurvePath, Vector3, Vector4 } from 'three';
import { SettingsService } from './settings.service';
import { SplineModeAPIEnum } from '../../api/structs';

@Injectable({
  providedIn: 'root',
})
export class CurveService {
  constructor(private readonly settingsService: SettingsService) {}

  public createSegmentCurve(centerCurves: any[]) {
    const curvesCount = centerCurves.length;
    const segmentCurve = new CurvePath<Vector3>();
    for (let curveIndex = 0; curveIndex < curvesCount; curveIndex++) {
      const knotVector: number[] = [];
      const controlPoints: any[] = [];
      const curve = centerCurves[curveIndex];
      const numberOfControlPoints = curve.controlPoints.length;
      const degree = parseInt(curve.degree);

      switch (this.settingsService.splineMode) {
        case SplineModeAPIEnum.unclamped:
          this.unclampedKnots(knotVector, numberOfControlPoints, degree);
          break;
        case SplineModeAPIEnum.clamped:
          this.clampedKnots(knotVector, numberOfControlPoints, degree);
          break;
      }

      curve.controlPoints.forEach((cp: { x: any; y: any; z: any }) => {
        controlPoints.push(new Vector4(cp.x, cp.y, cp.z, 1));
      });

      /*
       * caution
       * startKnot and endKnot are hardcoded into getTangent
       */
      segmentCurve.add(
        new NURBSCurve(
          degree,
          knotVector,
          controlPoints,
          degree,
          controlPoints.length
        )
      );
    }

    return segmentCurve;
  }

  private unclampedKnots(
    knotVector: number[],
    numberOfControlPoints: number,
    degree: number
  ) {
    const knotVectorLength = degree + numberOfControlPoints + 1;
    for (let k = 0; k < knotVectorLength; k++) {
      knotVector.push(k + 1);
    }
  }

  private clampedKnots(
    knotVector: number[],
    numberOfControlPoints: number,
    degree: number
  ) {
    const knotVectorLength = degree + numberOfControlPoints + 1;
    let beginA = 1;
    let beginB = degree + 1;
    let endA = knotVectorLength - degree;
    let endB = knotVectorLength;

    let i = 0;
    for (let k = 1; k <= knotVectorLength; k++) {
      if (k >= beginA && k <= beginB) {
        knotVector.push(0);
      }
      if (k > beginB && k < endA) {
        i = k - beginB;
        knotVector.push(i);
      }
      if (k >= endA && k <= endB) {
        knotVector.push(i + 1);
      }
    }
  }
}
