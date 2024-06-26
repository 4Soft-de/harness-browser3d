import { Bordnet, View } from 'harness-browser3d-library';

export class HarnessSelectionStruct {
  constructor(
    public readonly name: string,
    public bordnet?: Bordnet,
  ) {}
}

export class ViewSelectionStruct {
  constructor(
    public readonly view: View,
    public readonly name: string,
  ) {}
}
