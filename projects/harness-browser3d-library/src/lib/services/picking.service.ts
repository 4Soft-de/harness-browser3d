/*
  Copyright (C) 2022 4Soft GmbH
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as
  published by the Free Software Foundation, either version 2.1 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Lesser Public License for more details.

  You should have received a copy of the GNU General Lesser Public
  License along with this program. If not, see
  http://www.gnu.org/licenses/lgpl-2.1.html.
*/

import { Injectable, OnDestroy } from '@angular/core';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import {
  BufferGeometry,
  Mesh,
  NormalBlending,
  Raycaster,
  Scene,
  Vector2,
} from 'three';
import { getMousePosition } from '../utils/mouse-utils';
import { CameraService } from './camera.service';
import { SelectionService } from './selection.service';
import { SettingsService } from './settings.service';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { PassService } from './pass.service';
import { GeometryColors } from '../structs/colors';

@Injectable()
export class PickingService implements OnDestroy {
  private mousePosition?: Vector2;
  private previousMousePosition?: Vector2;
  private previousHoverName?: string;
  private outlinePass?: OutlinePass;
  private harnessElementGeos: BufferGeometry[] = [];
  private readonly scene = new Scene();
  private readonly subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly passService: PassService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService
  ) {
    this.subscription.add(
      settingsService.updatedGeometrySettings.subscribe(
        this.clearGeos.bind(this)
      )
    );

    if (this.settingsService.enablePicking) {
      this.subscription.add(
        passService.getSize().subscribe(this.initPass.bind(this))
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public initPickingEvents(canvas: HTMLCanvasElement): void {
    if (this.settingsService.enablePicking) {
      this.initMouseEvents(canvas);
      this.initTouchEvents(canvas);
    }
  }

  public animate() {
    if (this.mousePosition !== this.previousMousePosition) {
      this.previousMousePosition = this.mousePosition;
      this.hoverMesh(this.determineMesh(this.mousePosition));
    }
  }

  public addGeos(geos: BufferGeometry[]) {
    this.harnessElementGeos = geos;
    geos.forEach((geo) => {
      this.scene.add(new Mesh(geo));
    });
  }

  public clearGeos() {
    this.harnessElementGeos.forEach((geo) => geo.dispose());
    this.harnessElementGeos = [];
    this.clearMousePosition();
    this.scene.clear();
  }

  private initMouseEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'click', (event) => {
      const pos = getMousePosition(event, canvas);
      this.pickMesh(this.determineMesh(pos));
    });
    this.addEventListener(
      canvas,
      'mousemove',
      (event) => (this.mousePosition = getMousePosition(event, canvas))
    );
    this.addEventListener(
      canvas,
      'mouseout',
      this.clearMousePosition.bind(this)
    );
    this.addEventListener(
      canvas,
      'mouseleave',
      this.clearMousePosition.bind(this)
    );
  }

  private initTouchEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'touchstart', (event) => {
      event.preventDefault();
      const pos = getMousePosition(event, canvas);
      this.pickMesh(this.determineMesh(pos));
    });
    this.addEventListener(
      canvas,
      'touchmove',
      this.clearMousePosition.bind(this)
    );
    this.addEventListener(
      canvas,
      'touchend',
      this.clearMousePosition.bind(this)
    );
  }

  private addEventListener(
    canvas: HTMLCanvasElement,
    name: string,
    listener: (event: Event) => void
  ): void {
    this.subscription.add(
      fromEvent(canvas, name).pipe(debounceTime(10)).subscribe(listener)
    );
  }

  private initPass(size: Vector2): void {
    if (this.outlinePass) {
      this.outlinePass.resolution = size;
    } else {
      this.outlinePass = new OutlinePass(
        size,
        this.scene,
        this.cameraService.getCamera()
      );

      this.outlinePass.edgeStrength = 100;
      this.outlinePass.edgeGlow = 0;
      this.outlinePass.edgeThickness = 1;
      this.outlinePass.visibleEdgeColor = GeometryColors.selection;
      this.outlinePass.hiddenEdgeColor = GeometryColors.selection;
      this.outlinePass.overlayMaterial.blending = NormalBlending;

      this.passService.addPass(this.outlinePass);
    }
  }

  private clearMousePosition(): void {
    this.mousePosition = undefined;
  }

  private determineMesh(pos: Vector2 | undefined): Mesh | undefined {
    if (pos) {
      const raycaster = new Raycaster();
      raycaster.setFromCamera(pos, this.cameraService.getCamera());
      const intersection = raycaster.intersectObjects(this.scene.children)[0];
      return intersection?.object as Mesh;
    }
    return undefined;
  }

  private hoverMesh(mesh?: Mesh): void {
    if (mesh) {
      if (mesh.geometry.name !== this.previousHoverName) {
        this.previousHoverName = mesh.geometry.name;
        if (this.outlinePass) {
          this.outlinePass.selectedObjects = [mesh];
        }
      }
    } else if (this.outlinePass) {
      this.previousHoverName = undefined;
      this.outlinePass.selectedObjects = [];
    }
  }

  private pickMesh(mesh?: Mesh): void {
    if (mesh) {
      this.selectionService.selectElements(
        [mesh.geometry.name],
        this.settingsService.zoomPicking
      );
    }
  }
}
