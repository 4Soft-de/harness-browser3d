import { Harness, View } from 'harness-browser3d-library';

export class HarnessSelectionStruct {
  constructor(public readonly name: string, public harness?: Harness) {}
}

export class ViewSelectionStruct {
  constructor(public readonly view: View, public readonly name: string) {}
}
