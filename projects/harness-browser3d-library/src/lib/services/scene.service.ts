import { Injectable } from '@angular/core';
import { DirectionalLight, HemisphereLight, Scene } from 'three';

@Injectable({
  providedIn: 'root',
})
export class SceneService {
  private readonly scene: Scene;

  constructor() {
    this.scene = new Scene();
  }

  public getScene() {
    return this.scene;
  }

  public setupScene() {
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 0, 1).normalize();
    this.scene.add(directionalLight);

    const hemisphereLight = new HemisphereLight(0xffffff, 0xcccccc, 0.3);
    this.scene.add(hemisphereLight);
  }

  public clearScene() {
    this.scene.remove.apply(this.scene, this.scene.children);
  }
}
