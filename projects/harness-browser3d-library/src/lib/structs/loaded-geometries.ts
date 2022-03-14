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

import { BufferGeometry, Matrix4, Vector3 } from 'three';

export class LoadedGeometry {
  public readonly offset: Vector3;

  constructor(public readonly bufferGeometry: BufferGeometry) {
    const before = this.firstPosition();
    bufferGeometry.center();
    const after = this.firstPosition();
    this.offset = before.sub(after);
  }

  private array() {
    return this.bufferGeometry.attributes['position'].array;
  }

  private firstPosition() {
    return new Vector3(this.array()[0], this.array()[1], this.array()[2]);
  }

  public offsetMatrix() {
    return new Matrix4().makeTranslation(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
  }
}
