import { Curve, CurveJSON, Vector3 } from 'three';

export class InvertedCurve implements Curve<Vector3> {
  type: string;
  arcLengthDivisions: number;

  constructor(private readonly curve: Curve<Vector3>) {
    this.type = curve.type;
    this.arcLengthDivisions = curve.arcLengthDivisions;
  }

  getPoint(ratio: number, result?: Vector3): Vector3 {
    return this.curve.getPoint(1 - ratio, result);
  }

  getPointAt(ratio: number, result?: Vector3): Vector3 {
    return this.curve.getPointAt(1 - ratio, result);
  }

  getTangent(ratio: number, result?: Vector3): Vector3 {
    return this.curve.getTangent(1 - ratio, result);
  }

  getTangentAt(ratio: number, result?: Vector3): Vector3 {
    return this.curve.getTangentAt(1 - ratio, result);
  }

  getLength(): number {
    return this.curve.getLength();
  }

  computeFrenetFrames(
    segments: number,
    closed?: boolean,
  ): { tangents: Vector3[]; normals: Vector3[]; binormals: Vector3[] } {
    return this.curve.computeFrenetFrames(segments, closed);
  }

  getPoints(): Vector3[] {
    throw new Error('Method not implemented.');
  }

  getSpacedPoints(): Vector3[] {
    throw new Error('Method not implemented.');
  }

  getLengths(): number[] {
    throw new Error('Method not implemented.');
  }

  updateArcLengths(): void {
    throw new Error('Method not implemented.');
  }

  getUtoTmapping(): number {
    throw new Error('Method not implemented.');
  }

  clone(): this {
    throw new Error('Method not implemented.');
  }

  copy(): this {
    throw new Error('Method not implemented.');
  }

  toJSON(): CurveJSON {
    throw new Error('Method not implemented.');
  }

  fromJSON(): this {
    throw new Error('Method not implemented.');
  }
}
