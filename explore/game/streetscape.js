import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const bodyShape = new RoundedBoxGeometry(1, 1, 1, 2, 0.14);
const rubber = new T.MeshStandardMaterial({
  color: "#222421",
  roughness: 0.93,
});
const glass = new T.MeshStandardMaterial({
  color: "#728382",
  metalness: 0.85,
  roughness: 0.12,
});
const chrome = new T.MeshStandardMaterial({
  color: "#afb3ac",
  metalness: 0.8,
  roughness: 0.27,
});
export function parkedCar(scene, x, z, yaw, color) {
  const car = new T.Group();
  car.name = "parked-street-car";
  car.position.set(x, 0.12, z);
  car.rotation.y = yaw;
  const paint = new T.MeshPhysicalMaterial({
    color,
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 0.6,
  });
  const part = (px, y, pz, w, h, d, material) => {
    const mesh = new T.Mesh(bodyShape, material);
    mesh.position.set(px, y, pz);
    mesh.scale.set(w, h, d);
    mesh.castShadow = mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  };
  part(0, 0.57, 0, 1.78, 0.65, 4.3, paint);
  part(0, 1.09, -0.18, 1.51, 0.65, 2.35, glass);
  part(0, 1.42, -0.18, 1.49, 0.12, 1.65, paint);
  for (const side of [-1, 1]) {
    part(side * 0.75, 1.06, -0.1, 0.055, 0.7, 0.09, paint);
    part(side * 0.94, 1.06, 0.5, 0.22, 0.14, 0.25, paint);
    part(side * 0.54, 0.67, 2.15, 0.48, 0.18, 0.07, chrome);
    part(
      side * 0.59,
      0.7,
      -2.15,
      0.41,
      0.2,
      0.07,
      new T.MeshStandardMaterial({ color: "#873b2d" }),
    );
    for (const axle of [-1.35, 1.35]) {
      const wheel = new T.Mesh(
        new T.CylinderGeometry(0.34, 0.34, 0.24, 16),
        rubber,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.86, 0.35, axle);
      wheel.castShadow = true;
      car.add(wheel);
      const hub = new T.Mesh(
        new T.CylinderGeometry(0.19, 0.19, 0.25, 10),
        chrome,
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      car.add(hub);
    }
  }
  part(0, 0.36, 2.16, 1.5, 0.12, 0.08, rubber);
  scene.add(car);
}
