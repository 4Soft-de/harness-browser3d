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

import { Injectable } from '@angular/core';
import { Node, Segment, Occurrence } from 'harness-browser3d-library';
import { Color } from 'three';

type HarnessElement = Node | Segment | Occurrence;

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  color1 = new Color('blue');
  color2 = new Color('green');
  color3 = new Color('red');

  color1Modules: HarnessElement[] = [];
  color2Modules: HarnessElement[] = [];
  color3Modules: HarnessElement[] = [];

  colorsAreEmpty() {
    const length =
      this.color1Modules.length +
      this.color2Modules.length +
      this.color3Modules.length;
    return length == 0;
  }

  addToColorArray(array: HarnessElement[], module: HarnessElement) {
    if (array.includes(module)) {
      return;
    }
    array.push(module);

    const moduleList = [
      this.color1Modules,
      this.color2Modules,
      this.color3Modules,
    ].filter((e) => e != array);
    moduleList.forEach((colorArray) => {
      const index = colorArray.indexOf(module);
      if (index > -1) {
        colorArray.splice(index, 1);
      }
    });
  }

  removeColor(module: HarnessElement) {
    ColorService.checkIfExistsAndDelete(this.color1Modules, module) ||
      ColorService.checkIfExistsAndDelete(this.color2Modules, module) ||
      ColorService.checkIfExistsAndDelete(this.color3Modules, module);
  }

  private static checkIfExistsAndDelete(
    array: HarnessElement[],
    module: HarnessElement,
  ): boolean {
    const index = array.indexOf(module);
    if (index > -1) {
      array.splice(index, 1);
      return true;
    }
    return false;
  }

  setColors() {
    const color1ChangeList = this.color1Modules.map((module) =>
      ColorService.convertToApiColorArray(module, this.color1),
    );
    const color2ChangeList = this.color2Modules.map((module) =>
      ColorService.convertToApiColorArray(module, this.color2),
    );
    const color3ChangeList = this.color3Modules.map((module) =>
      ColorService.convertToApiColorArray(module, this.color3),
    );

    return [...color1ChangeList, ...color2ChangeList, ...color3ChangeList];
  }

  resetColors() {
    this.color1Modules = [];
    this.color2Modules = [];
    this.color3Modules = [];
    return [];
  }

  private static convertToApiColorArray(module: HarnessElement, color: Color) {
    return {
      harnessElementId: module.id,
      color: color,
    };
  }
}
