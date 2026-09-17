import React from 'react';
import {
  X,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sliders,
  Layers
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './CustomizeWidgetsModal.css';

export const CustomizeWidgetsModal: React.FC = () => {
  const {
    homeWidgets,
    toggleWidgetVisibility,
    moveWidget,
    resetHomeWidgets,
    isCustomizeWidgetsOpen,
    setIsCustomizeWidgetsOpen
  } = useApp();

  if (!isCustomizeWidgetsOpen) return null;

  return (
    <div
      className="customize-widgets-backdrop"
      onClick={() => setIsCustomizeWidgetsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Customize Home Screen Widgets"
    >
      <div
        className="glass-card customize-widgets-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customize-modal-header">
          <div className="customize-header-title">
            <Layers size={20} className="text-primary" />
            <div>
              <h2 className="modal-heading">Customize Dashboard Widgets</h2>
              <p className="modal-subheading">
                Reorder or toggle visibility of meteorological telemetry modules
              </p>
            </div>
          </div>

          <button
            className="btn-icon btn-ghost"
            onClick={() => setIsCustomizeWidgetsOpen(false)}
            aria-label="Close customizer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="widgets-list-body">
          {homeWidgets.map((widget, index) => {
            const isFirst = index === 0;
            const isLast = index === homeWidgets.length - 1;

            return (
              <div
                key={widget.id}
                className={`widget-item-row ${widget.visible ? 'is-visible' : 'is-hidden'}`}
              >
                <div className="widget-item-info">
                  <span className="widget-index-badge">{index + 1}</span>
                  <div className="widget-label-block">
                    <strong className="widget-label">{widget.label}</strong>
                    <span className="widget-status-text">
                      {widget.visible ? 'Visible on dashboard' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="widget-item-actions">
                  <div className="reorder-pair">
                    <button
                      className="widget-btn-arrow"
                      disabled={isFirst}
                      onClick={() => moveWidget(widget.id, 'up')}
                      title="Move up"
                      aria-label={`Move ${widget.label} up`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="widget-btn-arrow"
                      disabled={isLast}
                      onClick={() => moveWidget(widget.id, 'down')}
                      title="Move down"
                      aria-label={`Move ${widget.label} down`}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    className={`btn-toggle-vis ${widget.visible ? 'active' : 'inactive'}`}
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    title={widget.visible ? 'Hide widget' : 'Show widget'}
                    aria-label={`Toggle visibility of ${widget.label}`}
                  >
                    {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="customize-modal-footer">
          <button
            className="btn btn-secondary reset-btn"
            onClick={resetHomeWidgets}
          >
            <RotateCcw size={15} />
            <span>Restore Defaults</span>
          </button>

          <button
            className="btn btn-primary done-btn"
            onClick={() => setIsCustomizeWidgetsOpen(false)}
          >
            <Check size={16} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
