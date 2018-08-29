import plist from 'plist';

export default function engine(specs) {
  return plist.build(specs);
}
