import {
  AlwaysDepth,
  Color,
  FrontSide,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from 'three';

export class GeometryMaterial {
  public static readonly harness = new MeshLambertMaterial({
    vertexColors: true,
    side: FrontSide,
    wireframe: false,
    reflectivity: 1,
  });
  public static readonly selection = new MeshBasicMaterial({
    color: new Color('orange'),
    wireframe: false,
    reflectivity: 0,
    depthFunc: AlwaysDepth,
  });
  public static readonly boundingSphereInner = new MeshBasicMaterial({
    color: new Color('orange'),
    opacity: 0.1,
    transparent: true,
    side: FrontSide,
    wireframe: false,
  });
  public static readonly boundingSphereOuter = new MeshBasicMaterial({
    color: new Color('orange'),
    side: FrontSide,
    wireframe: true,
  });
  public static readonly boundingSphereCenter = new MeshBasicMaterial({
    color: new Color('yellow'),
    side: FrontSide,
    depthFunc: AlwaysDepth,
  });
}
