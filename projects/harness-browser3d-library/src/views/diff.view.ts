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

export const diffViewSettings = {
  displayUnmodified: true,
  displayAdded: true,
  displayRemoved: true,
  displayModifiedNew: true,
  displayModifiedOld: true,
};

enum StateEnum {
  hidden = 'hidden',
  unmodified = 'unmodified',
  added = 'added',
  removed = 'removed',
  modified_new = 'modified_new',
  modified_old = 'modified_old',
}

class State {
  public readonly colorString: string;
  public readonly idString: string;
  constructor(
    public readonly stateEnum: StateEnum,
    public readonly id: number,
    colorName: string
  ) {
    this.idString = `float(${id})`;
    const color = new Color(colorName);
    this.colorString = `vec4(${color.r}, ${color.g}, ${color.b}, ${1})`;
  }
}

const hiddenState = new State(StateEnum.hidden, 0, 'black');
const unmodifiedState = new State(StateEnum.unmodified, 1, 'lightgrey');
const addedState = new State(StateEnum.added, 2, 'mediumseagreen');
const removedState = new State(StateEnum.removed, 3, 'red');
const modifiedNewState = new State(StateEnum.modified_new, 4, 'dodgerblue');
const modifiedOldState = new State(StateEnum.modified_old, 5, 'steelblue');

function getState(property: string): State {
  const hide = (hidden: boolean, state: State) => {
    if (!hidden) {
      return hiddenState;
    } else {
      return state;
    }
  };

  switch (StateEnum[property as keyof typeof StateEnum]) {
    case StateEnum.hidden:
      return hiddenState;
    case StateEnum.unmodified:
      return hide(diffViewSettings.displayUnmodified, unmodifiedState);
    case StateEnum.added:
      return hide(diffViewSettings.displayAdded, addedState);
    case StateEnum.removed:
      return hide(diffViewSettings.displayRemoved, removedState);
    case StateEnum.modified_new:
      return hide(diffViewSettings.displayModifiedNew, modifiedNewState);
    case StateEnum.modified_old:
      return hide(diffViewSettings.displayModifiedOld, modifiedOldState);
    default:
      return hiddenState;
  }
}

const diffViewPropertyKey = 'diffState';

const diffViewDefaultValue = StateEnum.unmodified.toString();

function diffViewVertexShader(): string {
  let shader = ShaderLib.lambert.vertexShader;

  const declarations = `
    attribute float diffState;
    varying vec4 vStateColor;
  `;

  const code = `
    vec4 noneColor = vec4(0, 0, 0, 0);
    vec4 unmodifiedColor = diffState == ${unmodifiedState.idString} ? ${unmodifiedState.colorString} : noneColor;
    vec4 addedColor = diffState == ${addedState.idString} ? ${addedState.colorString} : noneColor;
    vec4 removedColor = diffState == ${removedState.idString} ? ${removedState.colorString} : noneColor;
    vec4 modifiedNewColor = diffState == ${modifiedNewState.idString} ? ${modifiedNewState.colorString} : noneColor;
    vec4 modifiedOldColor = diffState == ${modifiedOldState.idString} ? ${modifiedOldState.colorString} : noneColor;
    vStateColor = unmodifiedColor + addedColor + removedColor + modifiedNewColor + modifiedOldColor;
    gl_Position = diffState == ${hiddenState.idString} ? vec4(gl_Position.xyz, 0) : gl_Position;
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

const diffViewMapper = (properties: string[]) => {
  const array = properties.map((property) => getState(property).id);
  return new Int8BufferAttribute(array, 1);
};

export const diffView = new View(
  diffViewMaterial(),
  diffViewPropertyKey,
  diffViewDefaultValue,
  diffViewMapper
);
