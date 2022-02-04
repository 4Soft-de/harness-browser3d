import { Injectable } from '@angular/core';
import { Harness, Identifiable } from '../../api/alias';
import { ElementToVertexMapping } from '../structs/mapping';
import { Mesh } from 'three';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  public readonly harnessCache: Map<string, Harness> = new Map();
  public readonly elementHarnessCache: Map<string, Harness> = new Map();
  public readonly elementCache: Map<string, Identifiable> = new Map();
  public readonly harnessMeshCache: Map<string, Mesh> = new Map();
  public readonly vertexMappings: Map<string, ElementToVertexMapping> =
    new Map();

  public clear() {
    this.elementCache.clear();
    this.elementHarnessCache.clear();
    this.harnessMeshCache.clear();
  }

  constructor() {}
}
