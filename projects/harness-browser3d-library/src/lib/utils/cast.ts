import { Harness, PlacedHarnessOccurrence } from '../../api/alias';

export function isHarness(object: any): object is Harness {
  return (object as Harness) !== undefined;
}

export function isPlacedHarnessOccurrence(
  object: any
): object is PlacedHarnessOccurrence {
  return (object as PlacedHarnessOccurrence) !== undefined;
}
