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

import { Color, Scene } from 'three';

export interface SettingsAPIStruct {
  geometryMode?: GeometryModeAPIEnum;
  splineMode?: SplineModeAPIEnum;
  segmentCount?: number;
  curveStepsFactor?: number;
  pixelRatio?: number;
  enableAntiAliasing?: boolean;
  backgroundColor?: Color;
  hoverColor?: Color;
  addHarnessResetCamera?: boolean;
  zoomPicking?: boolean;
  zoomSelection?: boolean;

  // cannot be changed after init
  enablePicking?: boolean;
}

export interface HooksAPIStruct {
  geometryParser?: (data: string) => Scene;
  animateBegin?: () => void;
  animateEnd?: () => void;
}

export interface SetColorAPIStruct {
  harnessElementId: string;
  color: Color;
}

export interface SetViewPropertyAPIStruct {
  harnessElementId: string;
  propertyValue: string;
}

export enum GeometryModeAPIEnum {
  default,
  loaded,
}

export enum SplineModeAPIEnum {
  unclamped,
  clamped,
}

export enum DiffStateAPIEnum {
  unmodified = 0,
  added = 1,
  removed = 2,
  modified_new = 3,
  modified_old = 4,
}
