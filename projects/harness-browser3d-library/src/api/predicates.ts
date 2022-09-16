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
