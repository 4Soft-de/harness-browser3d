/*
  Copyright (C) 2024 4Soft GmbH
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

import { ShaderLib } from 'three';
import { DiffStateAPIEnum } from '../api/structs';
import { GeometryMaterial } from '../lib/structs/material';
import { View } from '../views/view';

function defaultViewVertexShader(): string {
  let shader = ShaderLib.lambert.vertexShader;

  const declarations = `
      attribute vec3 pDefaultColor;
      attribute vec3 pColor;
      attribute float pEnabled;
      attribute float pDiffState;
    `;

  const code = `
      vec3 emptyColor = vec3(0, 0, 0);
      vColor = pColor == emptyColor ? pDefaultColor : pColor;
      gl_Position =
        pEnabled == 0.0 ||
        pDiffState == ${DiffStateAPIEnum.removed.toFixed(1)} ||
        pDiffState == ${DiffStateAPIEnum.modified_old.toFixed(1)}
        ? vec4(gl_Position.xyz, 0) : gl_Position;
    `;

  let anchor = `#include <common>`;
  shader = shader.replace(anchor, anchor + declarations);
  anchor = `#include <clipping_planes_vertex>`;
  shader = shader.replace(anchor, anchor + code);

  return shader;
}

function defaultViewMaterial() {
  const material = GeometryMaterial.defaultHarness;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = defaultViewVertexShader();
    shader.fragmentShader = ShaderLib.lambert.fragmentShader;
  };
  return material;
}

export const defaultView = new View(defaultViewMaterial());
