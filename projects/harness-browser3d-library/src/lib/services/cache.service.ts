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
import { Harness, Identifiable } from '../../api/alias';
import { Mesh } from 'three';
import { dispose } from '../utils/dispose-utils';

@Injectable()
export class CacheService {
  public readonly harnessCache: Map<string, Harness> = new Map();
  public readonly elementHarnessCache: Map<string, Harness> = new Map();
  public readonly elementCache: Map<string, Identifiable> = new Map();
  public readonly harnessMeshCache: Map<string, Mesh> = new Map();

  public clear() {
    this.elementCache.clear();
    this.elementHarnessCache.clear();
    this.harnessMeshCache.forEach(dispose);
    this.harnessMeshCache.clear();
  }

  constructor() {}
}
