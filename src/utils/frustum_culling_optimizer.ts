// File: src/utils/frustumCullingOptimizer.ts

import * as THREE from 'three';

export class FrustumCullingOptimizer {
  private frustum: THREE.Frustum;
  private projScreenMatrix: THREE.Matrix4;
  

  constructor() {
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
  }

  updateFrustum(camera: THREE.Camera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  isPointInFrustum(point: THREE.Vector3): boolean {
    return this.frustum.containsPoint(point);
  }
}