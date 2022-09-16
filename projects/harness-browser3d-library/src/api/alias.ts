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

import { components } from '../generated/geometry';

export type Graphic = components['schemas']['Graphic'];
export type Point = components['schemas']['Point'];
export type Rotation = components['schemas']['Rotation'];
export type ViewProperties = components['schemas']['ViewProperties'];
export type Bordnet = components['schemas']['Bordnet'];
export type Harness = components['schemas']['Harness'];
export type BuildingBlock = components['schemas']['BuildingBlock'];
export type Node = components['schemas']['Node'];
export type Segment = components['schemas']['Segment'];
export type Curve = components['schemas']['Curve'];
export type Occurrence = components['schemas']['Occurrence'];
export type Placement = components['schemas']['Placement'];
export type OnPointPlacement = components['schemas']['OnPointPlacement'];
export type OnWayPlacement = components['schemas']['OnWayPlacement'];
export type Location = components['schemas']['Location'];
export type NodeLocation = components['schemas']['NodeLocation'];
export type SegmentLocation = components['schemas']['SegmentLocation'];

export enum PartType {
  Connector,
  Protection,
  Fixing,
  Other,
}

export enum Anchor {
  FromStartNode,
  FromEndNode,
}
