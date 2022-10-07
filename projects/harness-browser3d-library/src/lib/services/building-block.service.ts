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
import { BufferGeometry, Matrix4, Quaternion, Vector3 } from 'three';
import { BuildingBlock } from '../../api/alias';
import { ErrorUtils } from '../utils/error-utils';
import { HarnessUtils } from '../utils/harness-utils';

@Injectable()
export class BuildingBlockService {
  private readonly buildingBlockMatrixCache: Map<string, Matrix4> = new Map();

  constructor() {}

  public fillBuildingBlockMap(buildingBlock: BuildingBlock | null) {
    if (!buildingBlock) {
      console.warn(ErrorUtils.isNull('buildingBlock'));
      return;
    }

    let position = new Vector3();
    let rotation = new Quaternion();

    position = HarnessUtils.convertPointToVector(buildingBlock.position);
    rotation = HarnessUtils.computeQuaternionFromRotation(
      buildingBlock.rotation
    );

    const matrix = new Matrix4().compose(
      position,
      rotation,
      new Vector3(1, 1, 1)
    );

    this.buildingBlockMatrixCache.set(buildingBlock.id, matrix);
  }

  public applyBuildingBlock(buildingBlockId: string, geo: BufferGeometry) {
    const buildingBlock = this.buildingBlockMatrixCache.get(buildingBlockId);
    if (buildingBlock) {
      geo.applyMatrix4(buildingBlock);
    } else {
      console.warn(ErrorUtils.notFound(buildingBlockId));
    }
  }
}
