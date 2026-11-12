export const hasPermission = <T extends string>(
  userPermissions: readonly T[],
  requiredPermission: T
): boolean => {
  return userPermissions.includes(requiredPermission);
};