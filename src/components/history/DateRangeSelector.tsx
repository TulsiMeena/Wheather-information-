import React, { useState } from 'react';
import { Calendar, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import './DateRangeSelector.css';

interface DateRangeSelectorProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onRangeChange: (start: string, end: string) => void;
  isLoading: boolean;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onRangeChange,
  isLoading
}) => {
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Maximum allowed date: 2 days before today to ensure ERA5 archive coverage
  const today = new Date();
  const maxArchiveDateObj = new Date(today);
  maxArchiveDateObj.setDate(today.getDate() - 2);
  const maxDateStr = maxArchiveDateObj.toISOString().split('T')[0];

  // Minimum date: Open-Meteo goes back to 1940
  const minDateStr = '1950-01-01';

  const validateAndApply = (newStart: string, newEnd: string) => {
    setTempStart(newStart);
    setTempEnd(newEnd);

    if (!newStart || !newEnd) {
      setValidationError('Please select both start and end dates.');
      return;
    }

    if (newStart > maxDateStr || newEnd > maxDateStr) {
      setValidationError(`Historical archive is available up to ${maxDateStr}. Future or current-day dates cannot be queried in history.`);
      return;
    }

    if (newStart > newEnd) {
      setValidationError('Start date cannot be after end date.');
      return;
    }

    const s = new Date(newStart);
    const e = new Date(newEnd);
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      setValidationError('Maximum historical query range is 365 days for responsive performance.');
      return;
    }

    setValidationError(null);
    onRangeChange(newStart, newEnd);
  };

  const handlePreset = (days: number) => {
    const endObj = new Date(maxArchiveDateObj);
    const startObj = new Date(maxArchiveDateObj);
    startObj.setDate(endObj.getDate() - days + 1);

    const sStr = startObj.toISOString().split('T')[0];
    const eStr = endObj.toISOString().split('T')[0];

    setTempStart(sStr);
    setTempEnd(eStr);
    setValidationError(null);
    onRangeChange(sStr, eStr);
  };

  const handleLastYearSameMonth = () => {
    const endObj = new Date(today);
    endObj.setFullYear(today.getFullYear() - 1);
    
    // First day of that month
    const startObj = new Date(endObj.getFullYear(), endObj.getMonth(), 1);
    // Last day of that month
    const lastDayObj = new Date(endObj.getFullYear(), endObj.getMonth() + 1, 0);

    const sStr = startObj.toISOString().split('T')[0];
    const eStr = lastDayObj.toISOString().split('T')[0];

    setTempStart(sStr);
    setTempEnd(eStr);
    setValidationError(null);
    onRangeChange(sStr, eStr);
  };

  return (
    <div className="date-range-selector-card glass-card">
      <div className="range-header">
        <div className="range-title-group">
          <Calendar size={18} className="text-primary" />
          <h3 className="range-title">Historical Date Interval</h3>
        </div>
        <span className="archive-badge">Open-Meteo ERA5 Archive</span>
      </div>

      {/* Quick Presets */}
      <div className="presets-row" role="group" aria-label="Preset Date Ranges">
        <button
          className="preset-btn"
          onClick={() => handlePreset(7)}
          disabled={isLoading}
        >
          Last 7 Days
        </button>
        <button
          className="preset-btn"
          onClick={() => handlePreset(14)}
          disabled={isLoading}
        >
          Last 14 Days
        </button>
        <button
          className="preset-btn"
          onClick={() => handlePreset(30)}
          disabled={isLoading}
        >
          Last 30 Days
        </button>
        <button
          className="preset-btn"
          onClick={() => handlePreset(90)}
          disabled={isLoading}
        >
          Past Quarter (90d)
        </button>
        <button
          className="preset-btn highlight"
          onClick={handleLastYearSameMonth}
          disabled={isLoading}
        >
          <Sparkles size={13} />
          <span>Same Month Last Year</span>
        </button>
      </div>

      {/* Manual Input Controls */}
      <div className="date-inputs-row">
        <div className="date-input-field">
          <label htmlFor="history-start-date">Start Date</label>
          <input
            id="history-start-date"
            type="date"
            className="date-picker-input"
            value={tempStart}
            max={maxDateStr}
            min={minDateStr}
            disabled={isLoading}
            onChange={(e) => validateAndApply(e.target.value, tempEnd)}
          />
        </div>

        <span className="date-separator">→</span>

        <div className="date-input-field">
          <label htmlFor="history-end-date">End Date</label>
          <input
            id="history-end-date"
            type="date"
            className="date-picker-input"
            value={tempEnd}
            max={maxDateStr}
            min={minDateStr}
            disabled={isLoading}
            onChange={(e) => validateAndApply(tempStart, e.target.value)}
          />
        </div>
      </div>

      {validationError && (
        <div className="range-validation-error" role="alert">
          <AlertCircle size={15} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
