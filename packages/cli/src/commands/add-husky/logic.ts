import { isPackageInstalled, type Pkg } from '../../domain/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'husky') ? [] : ['husky'];
}
