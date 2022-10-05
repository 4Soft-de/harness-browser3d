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
  Node,
  NodeLocation,
  Occurrence,
  OnPointPlacement,
  OnWayPlacement,
  Segment,
  SegmentLocation,
} from './alias';

export function isNode(object: any): object is Node {
  const node = object as Node;
  return (
    defined(node.id) && defined(node.position) && defined(node.buildingBlockId)
  );
}

export function isSegment(object: any): object is Segment {
  const segment = object as Segment;
  return (
    defined(segment.id) &&
    defined(segment.curves) &&
    defined(segment.startNodeId) &&
    defined(segment.endNodeId) &&
    defined(segment.buildingBlockId)
  );
}

export function isOccurrence(object: any): object is Occurrence {
  const occurrence = object as Occurrence;
  return (
    defined(occurrence.id) &&
    defined(occurrence.partType) &&
    defined(occurrence.buildingBlockId)
  );
}

export function isOnPointPlacement(object: any): object is OnPointPlacement {
  const placement = object as OnPointPlacement;
  return defined(placement.locations);
}

export function isOnWayPlacement(object: any): object is OnWayPlacement {
  const placement = object as OnWayPlacement;
  return (
    defined(placement.startLocation) &&
    defined(placement.endLocation) &&
    defined(placement.segmentPath)
  );
}

export function isNodeLocation(object: any): object is NodeLocation {
  const location = object as NodeLocation;
  return defined(location.nodeId);
}

export function isSegmentLocation(object: any): object is SegmentLocation {
  const location = object as SegmentLocation;
  return (
    defined(location.segmentId) &&
    defined(location.anchor) &&
    defined(location.segmentOffsetLength)
  );
}

function defined(object: any): boolean {
  return object !== undefined && object !== null;
}
