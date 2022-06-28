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

import { Color, Int8BufferAttribute, ShaderLib } from 'three';
import { GeometryMaterial } from '../lib/structs/material';
import { View } from '../views/view';

class State {
  public readonly colorString: string;
  public readonly idString: string;
  constructor(
    public readonly name: string,
    public readonly id: number,
    color: Color
  ) {
    this.idString = `float(${id})`;
    this.colorString = `vec4(${color.r}, ${color.g}, ${color.b}, ${1})`;
  }
}

const addedState = new State('added', 1, new Color('mediumseagreen'));
const removedState = new State('removed', 2, new Color('red'));
const modifiedState = new State('modified', 3, new Color('dodgerblue'));
const unmodifiedState = new State('unmodified', 4, new Color('black'));

const diffViewPropertyKey = 'diffState';

const diffViewDefaultValue = unmodifiedState.name;

function diffViewVertexShader(): string {
  let shader = ShaderLib.lambert.vertexShader;

  const declarations = `
    attribute float diffState;
    varying vec4 vStateColor;
  `;

  const code = `
    vec4 noneColor = vec4(0, 0, 0, 0);
    vec4 addedColor = diffState == ${addedState.idString} ? ${addedState.colorString} : noneColor;
    vec4 removedColor = diffState == ${removedState.idString} ? ${removedState.colorString} : noneColor;
    vec4 modifiedColor = diffState == ${modifiedState.idString} ? ${modifiedState.colorString} : noneColor;
    vec4 unmodifiedColor = diffState == ${unmodifiedState.idString} ? ${unmodifiedState.colorString} : noneColor;
    vStateColor = addedColor + removedColor + modifiedColor + unmodifiedColor;
  `;

  let anchor = `#include <common>`;
  shader = shader.replace(anchor, anchor + declarations);
  anchor = `#include <color_vertex>`;
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

const diffViewMapper = (properties: string[]) => {
  const array = properties.map((property) => mapProperty(property));
  return new Int8BufferAttribute(array, 1);
};

function mapProperty(property: string): number {
  const getId = (property: string, state: State) => {
    if (property === state.name) {
      return state.id;
    }
    return undefined;
  };
  const ids = [addedState, removedState, modifiedState, unmodifiedState]
    .map((state) => getId(property, state))
    .filter((id) => id !== undefined);
  if (ids.length && ids[0]) {
    return ids[0];
  } else {
    return -1;
  }
}

export const diffView = new View(
  diffViewPropertyKey,
  diffViewDefaultValue,
  diffViewMaterial(),
  diffViewMapper
);
