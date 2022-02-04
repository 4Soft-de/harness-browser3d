import { BufferGeometry, Matrix4, Vector3 } from 'three';

export class LoadedGeometry {
  public readonly offset: Vector3;

  constructor(public readonly bufferGeometry: BufferGeometry) {
    const before = this.firstPosition();
    bufferGeometry.center();
    const after = this.firstPosition();
    this.offset = before.sub(after);
  }

  private array() {
    return this.bufferGeometry.attributes['position'].array;
  }

  private firstPosition() {
    return new Vector3(this.array()[0], this.array()[1], this.array()[2]);
  }

  public offsetMatrix() {
    return new Matrix4().makeTranslation(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
  }
}
