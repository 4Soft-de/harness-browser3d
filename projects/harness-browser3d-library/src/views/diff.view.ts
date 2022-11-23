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

import { Color, ShaderLib } from 'three';
import { DiffStateAPIEnum } from '../api/structs';
import { GeometryMaterial } from '../lib/structs/material';
import { View } from '../views/view';

export const diffViewSettings = {
  displayUnmodified: true,
  displayAdded: true,
  displayRemoved: true,
  displayModifiedNew: true,
  displayModifiedOld: true,
};

class State {
  public readonly colorString: string;
  public readonly idString: string;
  constructor(public readonly id: number, colorName: string) {
    this.idString = `float(${id})`;
    const color = new Color(colorName);
    this.colorString = `vec4(${color.r}, ${color.g}, ${color.b}, ${1})`;
  }
}

const unmodifiedState = new State(DiffStateAPIEnum.unmodified, 'lightgrey');
const addedState = new State(DiffStateAPIEnum.added, 'mediumseagreen');
const removedState = new State(DiffStateAPIEnum.removed, 'red');
const modifiedNewState = new State(DiffStateAPIEnum.modified_new, 'dodgerblue');
const modifiedOldState = new State(DiffStateAPIEnum.modified_old, 'steelblue');

function diffViewVertexShader(): string {
  let shader = ShaderLib.lambert.vertexShader;

  const declarations = `
    attribute float pDiffState;
    attribute float pEnabled;
    varying vec4 vStateColor;
  `;

  const code = `
    vec4 noneColor = vec4(0, 0, 0, 0);
    vec4 unmodifiedColor =
      pDiffState == ${unmodifiedState.idString} &&
      ${diffViewSettings.displayUnmodified}
      ? ${unmodifiedState.colorString} : noneColor;
    vec4 addedColor =
      pDiffState == ${addedState.idString} &&
      ${diffViewSettings.displayAdded}
      ? ${addedState.colorString} : noneColor;
    vec4 removedColor =
      pDiffState == ${removedState.idString} &&
      ${diffViewSettings.displayRemoved}
      ? ${removedState.colorString} : noneColor;
    vec4 modifiedNewColor =
      pDiffState == ${modifiedNewState.idString} &&
      ${diffViewSettings.displayModifiedNew}
      ? ${modifiedNewState.colorString} : noneColor;
    vec4 modifiedOldColor =
      pDiffState == ${modifiedOldState.idString} &&
      ${diffViewSettings.displayModifiedOld}
      ? ${modifiedOldState.colorString} : noneColor;
    vStateColor = unmodifiedColor + addedColor + removedColor + modifiedNewColor + modifiedOldColor;
    gl_Position =
      vStateColor == vec4(0, 0, 0, 0) ||
      pEnabled == 0.0
      ? vec4(gl_Position.xyz, 0) : gl_Position;
  `;

  let anchor = `#include <common>`;
  shader = shader.replace(anchor, anchor + declarations);
  anchor = `#include <clipping_planes_vertex>`;
  shader = shader.replace(anchor, code);

  return shader;
}

function diffViewFragmentShader(): string {
  let shader = ShaderLib.lambert.fragmentShader;

  const declarations = `
    varying vec4 vStateColor;
  `;

  const code = `
    diffuseColor *= vStateColor;
  `;

  let anchor = `#include <common>`;
  shader = shader.replace(anchor, anchor + declarations);
  anchor = `#include <color_fragment>`;
  shader = shader.replace(anchor, code);

  return shader;
}

function diffViewMaterial() {
  const material = GeometryMaterial.defaultHarness;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = diffViewVertexShader();
    shader.fragmentShader = diffViewFragmentShader();
  };
  return material;
}

export const diffView = new View(diffViewMaterial());
