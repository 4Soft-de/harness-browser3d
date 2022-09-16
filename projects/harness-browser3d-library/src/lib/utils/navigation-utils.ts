import { Occurrence, SegmentLocation } from '../../api/alias';
import {
  isNodeLocation,
  isOnPointPlacement,
  isSegmentLocation,
} from '../../api/predicates';

export function getNodeId(occurrence: Occurrence): string | undefined {
  const placement = occurrence.placement;
  if (isOnPointPlacement(placement) && placement.locations.length) {
    const location = placement.locations[0];
    if (isNodeLocation(location)) {
      return location.nodeId;
    }
  }
  return undefined;
}

export function getSegmentLocations(occurrence: Occurrence): SegmentLocation[] {
  const placement = occurrence.placement;
  if (isOnPointPlacement(placement)) {
    const locations: SegmentLocation[] = [];
    placement.locations.filter(isSegmentLocation).forEach((location) => {
      if (location.segmentId) {
        locations.push(location);
      }
    });
    return locations;
  }
  return [];
}
