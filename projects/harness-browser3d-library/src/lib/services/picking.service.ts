/*
  Copyright (C) 2025 4Soft GmbH
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
import {
  debounceTime,
  fromEvent,
  Observable,
  Subject,
  Subscription,
} from 'rxjs';
import { BufferGeometry, Mesh, NormalBlending, Scene, Vector2 } from 'three';
import { getCtrlPressed, getMousePosition } from '../utils/input-utils';
import { CameraService } from './camera.service';
import { SelectionService } from './selection.service';
import { SettingsService } from './settings.service';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { PickingPickerService } from './picking-picker.service';

@Injectable()
export class PickingService implements OnDestroy {
  private mousePosition?: Vector2;
  private previousMousePosition?: Vector2;
  private previousHoverName?: string;
  private outlinePass?: OutlinePass;

  private multiPickEnabled = false;
  private pickedIds = new Set<string>();
  private scene = new Scene();
  private readonly pickedIds$ = new Subject<Set<string>>();
  private readonly subscription = new Subscription();

  constructor(
    private readonly cameraService: CameraService,
    private readonly pickingPickerService: PickingPickerService,
    private readonly selectionService: SelectionService,
    private readonly settingsService: SettingsService,
  ) {
    let sub = settingsService.updatedPickingSettings.subscribe(() => {
      this.getPass().visibleEdgeColor = this.settingsService.hoverColor;
      this.getPass().hiddenEdgeColor = this.settingsService.hoverColor;
    });
    this.subscription.add(sub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.clear();
    this.outlinePass?.dispose();
  }

  public initPickingEvents(canvas: HTMLCanvasElement): void {
    if (this.settingsService.enablePicking) {
      this.initMouseEvents(canvas);
      this.initTouchEvents(canvas);
      this.initKeyboardEvents(canvas);
    }
  }

  public addGeos(geos: BufferGeometry[]) {
    geos.forEach((geo) => {
      const mesh = new Mesh(geo);
      mesh.name = geo.name;
      this.scene.add(mesh);
    });
  }

  public clear() {
    this.scene.clear();
  }

  public animate() {
    if (this.mousePosition !== this.previousMousePosition) {
      this.previousMousePosition = this.mousePosition;
      const id = this.pickingPickerService.determineHarnessElementId(
        this.mousePosition,
      );
      this.hoverId(id);
    }
  }

  public getPickedIds(): Observable<Set<string>> {
    return this.pickedIds$;
  }

  public getPass(): OutlinePass {
    if (!this.outlinePass) {
      this.outlinePass = new OutlinePass(
        new Vector2(),
        this.scene,
        this.cameraService.getCamera(),
      );

      this.outlinePass.edgeStrength = 100;
      this.outlinePass.edgeGlow = 0;
      this.outlinePass.edgeThickness = 1;
      this.outlinePass.visibleEdgeColor = this.settingsService.hoverColor;
      this.outlinePass.hiddenEdgeColor = this.settingsService.hoverColor;
      this.outlinePass.overlayMaterial.blending = NormalBlending;

      this.outlinePass.enabled = this.settingsService.enablePicking;
    }
    return this.outlinePass;
  }

  private initMouseEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'mousedown', (event) => {
      const pos = getMousePosition(event, canvas);
      this.pickId(this.pickingPickerService.determineHarnessElementId(pos));
    });
    this.addEventListener(
      canvas,
      'mousemove',
      (event) => (this.mousePosition = getMousePosition(event, canvas)),
    );
    this.addEventListener(
      canvas,
      'mouseout',
      this.clearMousePosition.bind(this),
    );
    this.addEventListener(
      canvas,
      'mouseleave',
      this.clearMousePosition.bind(this),
    );
  }

  private initTouchEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(canvas, 'touchstart', (event) => {
      event.preventDefault();
      const pos = getMousePosition(event, canvas);
      const id = this.pickingPickerService.determineHarnessElementId(pos);
      this.pickId(id);
    });
    this.addEventListener(
      canvas,
      'touchmove',
      this.clearMousePosition.bind(this),
    );
    this.addEventListener(
      canvas,
      'touchend',
      this.clearMousePosition.bind(this),
    );
  }

  private initKeyboardEvents(canvas: HTMLCanvasElement): void {
    this.addEventListener(
      canvas,
      'keydown',
      (event) => (this.multiPickEnabled = getCtrlPressed(event)),
    );
    this.addEventListener(
      canvas,
      'keyup',
      (event) => (this.multiPickEnabled = getCtrlPressed(event)),
    );
  }

  private addEventListener(
    canvas: HTMLCanvasElement,
    name: string,
    listener: (event: Event) => void,
  ): void {
    this.subscription.add(
      fromEvent(canvas, name).pipe(debounceTime(10)).subscribe(listener),
    );
  }

  private clearMousePosition(): void {
    this.mousePosition = undefined;
  }

  private getMesh(name: string): Mesh | undefined {
    const object = this.scene.getObjectByName(name);
    return object && 'isMesh' in object ? (object as Mesh) : undefined;
  }

  private hoverId(id?: string): void {
    if (id) {
      const mesh = this.getMesh(id);
      if (mesh && mesh.geometry.name !== this.previousHoverName) {
        this.previousHoverName = mesh.geometry.name;
        this.getPass().selectedObjects = [mesh];
      }
    } else if (this.previousHoverName) {
      this.previousHoverName = undefined;
      this.getPass().selectedObjects = [];
    }
  }

  private pickId(id?: string): void {
    if (id) {
      if (this.pickedIds.has(id) && this.multiPickEnabled) {
        return;
      }
      this.multiPickEnabled
        ? this.pickedIds.add(id)
        : (this.pickedIds = new Set([id]));
      this.selectionService.selectElements(
        this.pickedIds,
        this.settingsService.zoomPicking,
      );
      this.pickedIds$.next(this.pickedIds);
    }
  }
}
