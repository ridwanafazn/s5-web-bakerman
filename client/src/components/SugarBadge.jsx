import { sugarLevelMeta } from '../utils/products';

export default function SugarBadge({ level, grams }) {
  const meta = sugarLevelMeta(level);

  return (
    <span className={`sugar-badge ${meta.className}`}>
      <strong>{grams} g</strong>
      <span>{meta.label}</span>
    </span>
  );
}
