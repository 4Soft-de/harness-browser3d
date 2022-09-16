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

    const duplicateData = { ...data };
    duplicateData.id = duplicateData.id + this.index;
    const newBlock = { ...duplicateData.buildingBlocks[0] };
    newBlock.position = {
      x: 0,
      y: 0,
      z: this.index * 400,
    };
    duplicateData.buildingBlocks = [newBlock];

    return duplicateData;
  }

  async parseData(file: File) {
    return JSON.parse(await file.text())['harnesses'][0];
  }
}
