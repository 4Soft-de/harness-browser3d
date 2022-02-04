import { BufferGeometry } from 'three';

export class ElementToVertexMapping {
  public readonly harnessElementsToVertices: Map<string, VertexRange> =
    new Map();

  private initializeMap(size: number, blankValue: any) {
    const map: Map<number, any> = new Map();
    for (let i = 0; i < size; i++) {
      map.set(i, blankValue);
    }
    return map;
  }

  private mapToArray(map: Map<number, any>) {
    const array: any[] = [];
    map.forEach((value) => array.push(value));
    return array;
  }

  /**
   * converts map into attribute array
   */
  public apply(
    geo: BufferGeometry,
    defaultValue: any,
    values: Map<string, any>
  ) {
    const map = this.initializeMap(
      geo.attributes['position'].count,
      defaultValue
    );
    for (const entry of this.harnessElementsToVertices) {
      const id = entry[0];
      const range = entry[1];
      range.toArray().forEach((vertex) => {
        const value = values.get(id);
        if (value) {
          map.set(vertex, value);
        }
      });
    }
    return this.mapToArray(map);
  }
}

export class VertexRange {
  constructor(public readonly high: number, public readonly low: number) {}

  public toArray() {
    const array: number[] = [];
    for (let i = this.high; i <= this.low; i++) {
      array.push(i);
    }
    return array;
  }
}
