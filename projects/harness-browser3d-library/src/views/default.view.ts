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
  ShaderLib,
} from 'three';
import { View } from '../views/view';

const defaultViewPropertyKey = undefined;

const defaultViewDefaultValue = new Color('black').getHexString();

function defaultViewVertexShader(): string {
  let shader = ShaderLib.lambert.vertexShader;

  const declarations = `
      attribute vec3 pDefaultColor;
      attribute vec3 pColor;
    `;

  const code = `
      vec3 emptyColor = vec3(0, 0, 0);
      vColor = pColor == emptyColor ? pDefaultColor : pColor;
    `;

  let anchor = `#include <common>`;
  shader = shader.replace(anchor, anchor + declarations);
  anchor = `#include <color_vertex>`;
  shader = shader.replace(anchor, code);

  return shader;
}

function defaultViewMaterial() {
  const material = new MeshLambertMaterial({
    vertexColors: true,
    side: FrontSide,
    wireframe: false,
    reflectivity: 1,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = defaultViewVertexShader();
    shader.fragmentShader = ShaderLib.lambert.fragmentShader;
  };
  return material;
}

const defaultViewMapper = (properties: string[]) => {
  const array: number[] = [];
  properties
    .map((property) => Number.parseInt(property))
    .map((property) => new Color(property))
    .forEach((color) => array.push(color.r, color.g, color.b));
  return new Float32BufferAttribute(array, 3);
};

export const defaultView = new View(
  defaultViewPropertyKey,
  defaultViewDefaultValue,
  defaultViewMaterial(),
  defaultViewMapper
);
