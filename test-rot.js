function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta)
  };
}

const CGK_LAT = -6.125, CGK_LON = 106.655;
const pt = latLonToVec3(CGK_LAT, CGK_LON, 1);

console.log("Initial pt:", pt.x.toFixed(2), pt.y.toFixed(2), pt.z.toFixed(2));

for(let deg = -360; deg <= 360; deg += 45) {
   const rY = deg * Math.PI / 180;
   // if object is rotated ry around y axis:
   // x_new = x*cos(rY) + z*sin(rY)
   // z_new = -x*sin(rY) + z*cos(rY)
   const x2 = pt.x * Math.cos(rY) + pt.z * Math.sin(rY);
   const z2 = -pt.x * Math.sin(rY) + pt.z * Math.cos(rY);
   console.log(`RotY ${deg.toString().padStart(4)} deg: x=${x2.toFixed(3)}, z=${z2.toFixed(3)}`);
}

// Exactly finding roots for x=0, z>0
// x*cos(rY) + z*sin(rY) = 0 => tan(rY) = -x/z
let exactRY = Math.atan2(-pt.x, pt.z) * 180 / Math.PI;
console.log(`Exact target rotY (deg):`, exactRY.toFixed(2));
