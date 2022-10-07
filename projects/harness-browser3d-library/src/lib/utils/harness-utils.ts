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

import { Curve, Matrix4, Quaternion, Vector3 } from 'three';
import {
  Anchor,
  Harness,
  Node,
  Occurrence,
  Point,
  Rotation,
  Segment,
  SegmentLocation,
} from '../../api/alias';

export class HarnessUtils {
  private static readonly PROTECTION_RADIUS_INCREASE = 1;

  public static getHarnessElementIds(harness: Harness): string[] {
    const elements: string[] = [];
    harness.nodes.forEach((node: Node) => elements.push(node.id));
    harness.segments.forEach((segment: Segment) => elements.push(segment.id));
    harness.occurrences.forEach((occurrence: Occurrence) =>
      elements.push(occurrence.id)
    );
    return elements;
  }

  public static computeQuaternionFromRotation(rotation: Rotation): Quaternion {
    if (rotation.matrix.length != 9) {
      console.error('input rotation matrix must have exactly 9 entries');
      return new Quaternion();
    }

    return new Quaternion().setFromRotationMatrix(
      new Matrix4().set(
        rotation.matrix[0],
        rotation.matrix[1],
        rotation.matrix[2],
        0,
        rotation.matrix[3],
        rotation.matrix[4],
        rotation.matrix[5],
        0,
        rotation.matrix[6],
        rotation.matrix[7],
        rotation.matrix[8],
        0,
        0,
        0,
        0,
        1
      )
    );
  }

  public static convertPointToVector(point: Point): Vector3 {
    return new Vector3(point.x, point.y, point.z);
  }

  public static computeRadiusFromCrossSectionArea(
    crossSectionArea: number
  ): number {
    return Math.sqrt(crossSectionArea / Math.PI);
  }

  public static computeDefaultProtectionRadius(
    crossSectionArea: number
  ): number {
    return (
      this.computeRadiusFromCrossSectionArea(crossSectionArea) +
      this.PROTECTION_RADIUS_INCREASE
    );
  }

  public static computeRatio(
    location: SegmentLocation,
    length: number
  ): number {
    const ratio = location.segmentOffsetLength / length;
    return Anchor[location.anchor as keyof typeof Anchor] ===
      Anchor.FromStartNode
      ? ratio
      : 1 - ratio;
  }

  public static isCurveInverted(
    startNode: Node,
    endNode: Node,
    curve: Curve<Vector3>
  ): boolean {
    const curveStart = curve.getPoint(0);
    const startPosition = HarnessUtils.convertPointToVector(startNode.position);
    const endPosition = HarnessUtils.convertPointToVector(endNode.position);
    return (
      startPosition.distanceTo(curveStart) > endPosition.distanceTo(curveStart)
    );
  }

  public static computeSegmentDirection(
    startNode: Node,
    endNode: Node,
    direction: Vector3
  ): Vector3 {
    const nodeAPosition = HarnessUtils.convertPointToVector(startNode.position);
    const nodeBPosition = HarnessUtils.convertPointToVector(endNode.position);
    if (
      nodeAPosition.clone().add(direction).distanceTo(nodeBPosition) <
      nodeAPosition.distanceTo(nodeBPosition)
    ) {
      direction.multiplyScalar(-1);
    }
    return direction;
  }
}
