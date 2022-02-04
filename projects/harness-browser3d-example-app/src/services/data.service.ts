import { Injectable } from '@angular/core';
import { Harness } from 'harness-browser3d-library';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  index: number = 0;

  copyHarness(data: Harness) {
    if (data == undefined) {
      return;
    }

    this.index++;
    function point(x: number, y: number, z: number) {
      return {
        x: x,
        y: y,
        z: z,
      };
    }

    const duplicateData = { ...data };
    duplicateData.id = duplicateData.id + this.index;
    const newBlock = { ...duplicateData.buildingBlocks[0] };
    newBlock.placement = {
      location: {
        x: 0,
        y: 0,
        z: this.index * 400,
      },
      u: point(1, 0, 0),
      v: point(0, 1, 0),
      w: point(0, 0, 1),
    };
    duplicateData.buildingBlocks = [newBlock];

    return duplicateData;
  }

  async parseData(file: File) {
    return JSON.parse(await file.text())['harnesses'][0];
  }
}
