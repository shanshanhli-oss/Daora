/** Bottom-up line title. Index 0 is 初爻, index 5 is 上爻. Yang is 九, yin is 六. */
export function lineTitle(index, yang) {
  const num = yang ? '九' : '六';
  if (index === 0) return `初${num}`;
  if (index === 5) return `上${num}`;
  return `${num}${'二三四五'[index - 1]}`;
}

export function hexagramSymbol(no) {
  return String.fromCodePoint(0x4dbf + no);
}
