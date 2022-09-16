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
  NodeLocation,
  OnPointPlacement,
  OnWayPlacement,
  SegmentLocation,
} from './alias';

export function isOnPointPlacement(object: any): object is OnPointPlacement {
  const placement = object as OnPointPlacement;
  return placement.locations !== undefined;
}

export function isOnWayPlacement(object: any): object is OnWayPlacement {
  const placement = object as OnWayPlacement;
  return (
    placement.startLocation !== undefined &&
    placement.endLocation !== undefined &&
    placement.segmentPath !== undefined
  );
}

export function isNodeLocation(object: any): object is NodeLocation {
  const location = object as NodeLocation;
  return location.nodeId !== undefined;
}

export function isSegmentLocation(object: any): object is SegmentLocation {
  const location = object as SegmentLocation;
  return (
    location.segmentId !== undefined &&
    location.anchor !== undefined &&
    location.segmentOffsetLength !== undefined
  );
}
