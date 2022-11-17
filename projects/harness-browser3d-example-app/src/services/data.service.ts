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
import { HttpClient } from '@angular/common/http';
import { Bordnet, Graphic, Harness } from 'harness-browser3d-library';
import * as exampleBordnet from '../assets/exampleHarness.json';
import * as debugHarness from '../assets/debugHarness.json';
import * as brokenHarness from '../assets/brokenHarness.json';
import * as protectionHarness from '../assets/protectionHarness.json';
import { filenames } from '../assets/geometries/filenames';
import { map, Observable, of, zip } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private readonly httpClient: HttpClient) {}

  private getGeometry(filename: string): Observable<Graphic> {
    return this.httpClient
      .get('/assets/geometries/' + filename, {
        observe: 'body',
        responseType: 'text',
      })
      .pipe(
        map((data) => {
          return {
            partNumber: filename.substring(0, filename.length - 4),
            data: data,
          };
        })
      );
  }

  private filterGeos(harness: Harness, geos: Graphic[]): Graphic[] {
    const set = new Set<string>();
    harness.occurrences.forEach((occurrence) => {
      if (occurrence.partNumber) {
        set.add(occurrence.partNumber);
      }
    });
    return geos.filter((geo) => set.has(geo.partNumber));
  }

  private patchExampleBordnet(): Observable<any> {
    return zip(filenames.map(this.getGeometry.bind(this))).pipe(
      map((geos) => {
        this.exampleBordnetInternal = exampleBordnet;
        this.exampleBordnetInternal.harnesses.forEach(
          (harness: Harness) =>
            (harness.graphics = this.filterGeos(harness, geos))
        );
        return this.exampleBordnetInternal;
      })
    );
  }

  private exampleBordnetInternal?: any = undefined;
  get exampleBordnet(): Observable<any> {
    return this.exampleBordnetInternal
      ? of(this.exampleBordnetInternal)
      : this.patchExampleBordnet();
  }

  get debugHarness(): Bordnet {
    return debugHarness as Bordnet;
  }

  get brokenHarness(): Bordnet {
    return brokenHarness as Bordnet;
  }

  get protectionHarness(): Bordnet {
    return protectionHarness as Bordnet;
  }

  async parseData(file: File) {
    return JSON.parse(await file.text());
  }
}
