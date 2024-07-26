import * as THREE from 'three';
import RBush from 'rbush';
import { ArcIndex } from '@/Interfaces/Border_Interfaces';


// Utility functions
// New helper function to process polygons
export const processPolygon = (
    polygon: number[][][],
    countryId: string,
    index: RBush<ArcIndex>,
    allLines: THREE.Vector3[][],
    radius: number
  ) => {
    polygon.forEach((ring: number[][]) => {
      const line: THREE.Vector3[] = [];
      ring.forEach((point: number[]) => {
        const [lon, lat] = point;
        line.push(latLonToVector3(lat, lon, radius));
      });
      allLines.push(line);
  
      // Index the arcs
      const bbox = getBoundingBox(ring);
      index.insert({
        ...bbox,
        arc: ring,
        countryId,
      });
    });
};
  
export function calculatePolygonArea(coordinates: number[][]): number {
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  return Math.abs(area) / 2;
}
  
  
 export const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
  
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
  
    return new THREE.Vector3(x, y, z);
  };
  
  export const vector3ToLonLat = (point: THREE.Vector3, radius: number): [number, number] => {
    const lat = 90 - Math.acos(point.y / radius) * 180 / Math.PI;
    const lon = (Math.atan2(point.z, point.x) * 180 / Math.PI + 180) % 360 - 180;
    return [lon, lat];
  };
  
  export const topoToLonLat = ([x, y]: number[], transform: any): [number, number] => {
    const lon = transform.scale[0] * x + transform.translate[0];
    const lat = transform.scale[1] * y + transform.translate[1];
    return [lon, lat];
  };
  
  export const lonLatToTopo = ([lon, lat]: [number, number], transform: any): [number, number] => {
    const x = (lon - transform.translate[0]) / transform.scale[0];
    const y = (lat - transform.translate[1]) / transform.scale[1];
    return [x, y];
  };
  
  export const getBoundingBox = (arc: number[][]): { minX: number; minY: number; maxX: number; maxY: number } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    arc.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    return { minX, minY, maxX, maxY };
  };
  
  export const pointToArcDistance = (point: number[], arc: number[][]): number => {
    let minDistance = Infinity;
    for (let i = 0; i < arc.length - 1; i++) {
      const distance = pointToLineSegmentDistance(point, arc[i], arc[i + 1]);
      minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
  };
  
  export const pointToLineSegmentDistance = (point: number[], start: number[], end: number[]): number => {
    const [x, y] = point;
    const [x1, y1] = start;
    const [x2, y2] = end;
  
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
  
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
  
    let xx, yy;
  
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
  
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };
  