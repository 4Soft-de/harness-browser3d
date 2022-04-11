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
  Color,
  Float32BufferAttribute,
  FrontSide,
  MeshLambertMaterial,
} from 'three';
import { View } from '../views/view';

export const colorHarnessPropertyKey = 'customColor';

const colorShaderPropertyKey = 'color';

const defaultViewDefaultValue = new Color('black').getHexString();

const colorViewMaterial = new MeshLambertMaterial({
  vertexColors: true,
  side: FrontSide,
  wireframe: false,
  reflectivity: 1,
});

const colorViewMapper = (properties: string[]) => {
  const array: number[] = [];
  properties
    .map((property) => Number.parseInt(property))
    .map((property) => new Color(property))
    .forEach((color) => array.push(color.r, color.g, color.b));
  return new Float32BufferAttribute(array, 3);
};

export const colorView = new View(
  colorHarnessPropertyKey,
  colorShaderPropertyKey,
  defaultViewDefaultValue,
  colorViewMaterial,
  colorViewMapper
);
