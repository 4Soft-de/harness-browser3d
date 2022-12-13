import { Injectable } from '@angular/core';
import {
  AmbientLight,
  DirectionalLight,
  MathUtils,
  Matrix4,
  Scene,
  Vector3,
} from 'three';
import { CameraService } from './camera.service';

@Injectable()
export class LightsService {
  private lightA: DirectionalLight[] = [];
  private lightB: DirectionalLight[] = [];

  constructor(private readonly cameraService: CameraService) {}

  public addLights(scene: Scene) {
    const lightA = new DirectionalLight(0xffffff, 0.5);
    const lightB = new DirectionalLight(0xffffff, 0.5);
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.lightA.push(lightA);
    this.lightB.push(lightB);
    scene.add(lightA);
    scene.add(lightB);
    scene.add(ambientLight);
  }

  public animate() {
    const camera = this.cameraService.getCamera();
    const target = this.cameraService.getControls()?.target ?? new Vector3();

    const axis = new Vector3(0, 1, 0)
      .unproject(camera)
      .sub(new Vector3(0, 0, 0).unproject(camera))
      .normalize();

    const dir = new Vector3()
      .subVectors(target, camera.position)
      .applyMatrix4(
        new Matrix4().makeRotationAxis(axis, MathUtils.degToRad(45))
      );

    this.lightA.forEach((lightA) =>
      lightA.position.copy(dir).multiplyScalar(-1).normalize()
    );
    this.lightB.forEach((lightB) => lightB.position.copy(dir).normalize());
  }
}
