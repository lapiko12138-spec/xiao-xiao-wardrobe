const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function assetPath(path?: string) {
  if (!path) {
    return path;
  }

  if (
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  if (!basePath || !path.startsWith("/")) {
    return path;
  }

  return `${basePath}${path}`;
}
