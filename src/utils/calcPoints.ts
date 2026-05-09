/**
 * SBTE Kerala Activity Points Rules
 * Mirrors activity-points-frontend/src/utils/calcPoints.js exactly
 */

export const PASS_THRESHOLD = {regular: 60, lateral: 40};
export const PER_SEGMENT_CAP = {regular: 40, lateral: 30};
const DEFAULT_MAX = 40;

export function calcCappedPoints(
  approvedCerts: any[],
  categories: any[] = [],
  isLateralEntry = false,
): number {
  const perSegmentCap = isLateralEntry
    ? PER_SEGMENT_CAP.lateral
    : PER_SEGMENT_CAP.regular;

  const grouped: Record<string, {certs: any[]; catDoc: any}> = {};
  approvedCerts.forEach(cert => {
    const catId = cert.category?._id || cert.category;
    if (!catId) return;
    const catKey = catId.toString();
    if (!grouped[catKey]) {
      const catDoc =
        cert.category && typeof cert.category === 'object' && cert.category.name
          ? cert.category
          : categories.find(
              c => c._id === catKey || c._id?.toString() === catKey,
            ) || null;
      grouped[catKey] = {certs: [], catDoc};
    }
    grouped[catKey].certs.push(cert);
  });

  let grandTotal = 0;

  Object.values(grouped).forEach(({certs, catDoc}) => {
    const catName = (catDoc?.name || '').toLowerCase();
    const catMaxPts = catDoc?.maxPoints ?? DEFAULT_MAX;
    const hasExplicitCeiling = catMaxPts !== DEFAULT_MAX;
    const effectiveCap = hasExplicitCeiling
      ? isLateralEntry
        ? Math.min(catMaxPts, perSegmentCap)
        : catMaxPts
      : perSegmentCap;

    let catSum = 0;
    if (
      catName.includes('arts') ||
      catName.includes('sports') ||
      catName.includes('games')
    ) {
      catSum = Math.max(...certs.map((c: any) => c.pointsAwarded || 0), 0);
    } else {
      catSum = certs.reduce((s: number, c: any) => s + (c.pointsAwarded || 0), 0);
    }

    grandTotal += Math.min(catSum, effectiveCap);
  });

  return grandTotal;
}

export function passThreshold(isLateralEntry?: boolean): number {
  return isLateralEntry ? PASS_THRESHOLD.lateral : PASS_THRESHOLD.regular;
}
