import { Injectable } from '@angular/core';
import {
  Identifiable
} from 'harness-browser3d-library';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  color1 = [6, 111, 223];
  color2 = [126, 188, 137];
  color3 = [238, 150, 75];

  color1Modules: Identifiable[] = [];
  color2Modules: Identifiable[] = [];
  color3Modules: Identifiable[] = [];

  colorsAreEmpty() {
    return this.color1Modules.length +
      this.color2Modules.length +
      this.color3Modules.length ==
      0
  }

  addToColorArray(
    array: Identifiable[],
    module: Identifiable
  ) {

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

  removeColor(module: Identifiable) {
    ColorService.checkIfExistsAndDelete(this.color1Modules, module) ||
    ColorService.checkIfExistsAndDelete(this.color2Modules, module) ||
    ColorService.checkIfExistsAndDelete(this.color3Modules, module);
  }

  private static checkIfExistsAndDelete(
    array: Identifiable[],
    module: Identifiable
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
      ColorService.convertToApiColorArray(module, this.color1)
    );
    const color2ChangeList = this.color2Modules.map((module) =>
      ColorService.convertToApiColorArray(module, this.color2)
    );
    const color3ChangeList = this.color3Modules.map((module) =>
      ColorService.convertToApiColorArray(module, this.color3)
    );

    return [
      ...color1ChangeList,
      ...color2ChangeList,
      ...color3ChangeList,
    ];
  }

  resetColors() {
    this.color1Modules = [];
    this.color2Modules = [];
    this.color3Modules = [];
    return [];
  }

  private static convertToApiColorArray(
    module: Identifiable,
    color: number[]
  ) {
    return {
      id: module.id,
      colorR: color[0],
      colorG: color[1],
      colorB: color[2],
    };
  }
}
