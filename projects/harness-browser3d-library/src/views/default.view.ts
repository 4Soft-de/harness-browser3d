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

import { Float32BufferAttribute, FrontSide, MeshLambertMaterial } from 'three';
import { View } from '../views/view';
import { GeometryColors } from '../lib/structs/colors';

export class DefaultViewProperties {
  public static readonly segment = 'segment';
  public static readonly protection = 'protection';
  public static readonly fixing = 'fixing';
  public static readonly connector = 'connector';
  public static readonly accessory = 'accessory';
}

export const defaultHarnessPropertyKey = 'defaultColor';

const defaultShaderPropertyKey = 'color';

const defaultViewDefaultValue = 'none';

const defaultViewMaterial = new MeshLambertMaterial({
  vertexColors: true,
  side: FrontSide,
  wireframe: false,
  reflectivity: 1,
});

const defaultViewMapper = (properties: string[]) => {
  const array: number[] = [];
  properties
    .map((property) => {
      let color = GeometryColors.notFound;
      if (property === DefaultViewProperties.segment) {
        color = GeometryColors.segment;
      }
      if (property === DefaultViewProperties.protection) {
        color = GeometryColors.protection;
      }
      if (property === DefaultViewProperties.fixing) {
        color = GeometryColors.fixing;
      }
      if (property === DefaultViewProperties.connector) {
        color = GeometryColors.connector;
      }
      if (property === DefaultViewProperties.accessory) {
        color = GeometryColors.accessory;
      }
      return color;
    })
    .forEach((color) => array.push(color.r, color.g, color.b));
  return new Float32BufferAttribute(array, 3);
};

export const defaultView = new View(
  defaultHarnessPropertyKey,
  defaultShaderPropertyKey,
  defaultViewDefaultValue,
  defaultViewMaterial,
  defaultViewMapper
);
