
export async function loadAsset(url) {
  return await fetch(url).then(res => res.text());
}
