/*
  Copyright (C) 2025 4Soft GmbH
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

import { FrontSide, MeshLambertMaterial } from 'three';
import { GeometryColors } from './colors';

export class GeometryMaterial {
  public static get defaultHarness() {
    return new MeshLambertMaterial({
      vertexColors: true,
      side: FrontSide,
      wireframe: false,
    });
  }

  public static get selection() {
    return new MeshLambertMaterial({
      color: GeometryColors.selection,
      side: FrontSide,
      wireframe: false,
    });
  }
}
