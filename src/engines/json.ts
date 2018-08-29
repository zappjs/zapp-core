export default function engine(specs) {
  const result = JSON.stringify(specs, null, '  ');
  return `${result}\n`;
}
