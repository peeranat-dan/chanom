/** The longest shared folder prefix of `files`, including its trailing slash. */
export default function commonDir(files: readonly string[]): string {
  const [first = ''] = files;
  let prefix = first.slice(0, first.lastIndexOf('/') + 1);
  for (const file of files) {
    while (!file.startsWith(prefix)) {
      prefix = prefix.slice(0, prefix.lastIndexOf('/', prefix.length - 2) + 1);
    }
  }
  return prefix;
}
