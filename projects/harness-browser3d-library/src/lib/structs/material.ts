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

import {
  AlwaysDepth,
  Color,
  FrontSide,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from 'three';

export class GeometryMaterial {
  public static readonly harness = new MeshLambertMaterial({
    vertexColors: true,
    side: FrontSide,
    wireframe: false,
    reflectivity: 1,
  });
  public static readonly selection = new MeshBasicMaterial({
    color: new Color('orange'),
    wireframe: false,
    reflectivity: 0,
    depthFunc: AlwaysDepth,
  });
  public static readonly boundingSphereInner = new MeshBasicMaterial({
    color: new Color('orange'),
    opacity: 0.1,
    transparent: true,
    side: FrontSide,
    wireframe: false,
  });
  public static readonly boundingSphereOuter = new MeshBasicMaterial({
    color: new Color('orange'),
    side: FrontSide,
    wireframe: true,
  });
  public static readonly boundingSphereCenter = new MeshBasicMaterial({
    color: new Color('yellow'),
    side: FrontSide,
    depthFunc: AlwaysDepth,
  });
}
