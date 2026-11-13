import { Link } from 'react-router-dom';

import { useSession } from '../context/SessionContext';

export default function BudgetBar() {
  const { profile, budget, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="budget-bar budget-bar-loading">
        Memuat budget gula mingguan…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="budget-bar budget-bar-guest">
        <span>Gagal memuat budget.</span>
        <Link to="/balance" className="budget-bar-link">
          Coba lagi
        </Link>
      </div>
    );
  }

  if (!profile || !budget) {
    return (
      <div className="budget-bar budget-bar-guest">
        <span>Masuk untuk melihat sisa budget gula mingguanmu.</span>
        <Link to="/signin" className="budget-bar-link">
          Masuk
        </Link>
      </div>
    );
  }

  const total = Number(budget.totalGrams) || 0;
  const consumed = Number(budget.consumedGrams) || 0;
  const remaining = Number(budget.remainingGrams) || 0;
  const over = remaining < 0 ? Math.abs(remaining) : 0;
  const usedPercent = total > 0 ? Math.min(100, Math.max(0, (consumed / total) * 100)) : 0;

  return (
    <div className={`budget-bar ${over > 0 ? 'budget-bar-over' : ''}`}>
      <div className="budget-bar-copy">
        <strong>
          {over > 0
            ? `Lewat ${over} g dari budget`
            : `Sisa budget: ${remaining} g`}
        </strong>
        <span>
          {consumed} g terpakai dari {total} g · mode{' '}
          {budget.mode === 'strict' ? 'Strict' : 'Guide'}
        </span>
      </div>

      <div
        className="budget-bar-track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={Math.min(consumed, total)}
        aria-label="Pemakaian budget gula mingguan"
      >
        <div className="budget-bar-fill" style={{ width: `${usedPercent}%` }} />
      </div>

      <Link to="/balance" className="budget-bar-link">
        Atur budget
      </Link>
    </div>
  );
}
