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

import { View } from 'harness-browser3d-library';
import { Color, Float32BufferAttribute } from 'three';

const debugViewProperty = 'debug';
const debugViewDefaultValue = 'false';

// copied and modified shaders
// https://threejs.org/examples/#webgl_custom_attributes_lines
const debugViewVertexShader = `attribute vec3 debug;
  varying vec3 debugColor;
  void main() {
  outputColor = debug;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const debugViewFragmentShader = `varying vec3 debugColor;
  void main() {
  gl_FragColor = vec4(debugColor, 1.0);
  }`;

const debugViewMapper = (properties: string[]) => {
  const array: number[] = [];
  properties
    .map((property) => {
      let color = new Color('blue');
      if (property === 'true') {
        color = new Color('red');
      }
      return color;
    })
    .forEach((color) => array.push(color.r, color.g, color.b));
  return new Float32BufferAttribute(array, 3);
};

export const debugView = new View(
  debugViewProperty,
  debugViewDefaultValue,
  debugViewVertexShader,
  debugViewFragmentShader,
  debugViewMapper
);
