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

export interface SettingsAPIStruct {
  geometryMode?: GeometryModeAPIEnum;
  splineMode?: SplineModeAPIEnum;
  segmentCount?: number;
  curveStepsFactor?: number;
  pixelRatio?: number;
}

export interface SetColorAPIStruct {
  id: string;
  colorR: number;
  colorG: number;
  colorB: number;
}

export interface BoundingSphereAPIStruct {
  centerId: string;
  radius: number;
}

export enum GeometryModeAPIEnum {
  default,
  loaded,
}

export enum SplineModeAPIEnum {
  unclamped,
  clamped,
}
