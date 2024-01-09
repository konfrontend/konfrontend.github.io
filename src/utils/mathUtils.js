export function toRadians (degrees) {
  return (degrees * Math.PI) / 180
}
export function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}
export function randomArbitrary (min, max) {
  return Math.random() * (max - min) + min
}
export function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
export function spherical (radian1, radian2, radius) {
  return [
    Math.sin(radian1) * Math.cos(radian2) * radius,
    Math.cos(radian1) * radius,
    Math.sin(radian1) * Math.sin(radian2) * radius,
  ]
}
