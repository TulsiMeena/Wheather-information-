import React from 'react';
import { WeatherConditionType } from '../../types/weather';
import './WeatherVisual.css';

interface WeatherVisualProps {
  condition?: WeatherConditionType;
  isDaytime?: boolean;
}

export const WeatherVisual: React.FC<WeatherVisualProps> = ({
  condition = 'clear',
  isDaytime = true,
}) => {
  // Normalize conditions
  let effectiveCondition = condition;
  if (!isDaytime && (condition === 'clear' || condition === 'unknown')) {
    effectiveCondition = 'night';
  }

  const isRaining =
    effectiveCondition === 'rain' ||
    effectiveCondition === 'heavy-rain' ||
    effectiveCondition === 'drizzle' ||
    effectiveCondition === 'freezing-rain';

  return (
    <div
      className={`weather-visual-backdrop condition-${effectiveCondition} ${!isDaytime ? 'is-night' : 'is-day'}`}
      aria-hidden="true"
    >
      <div className="atmospheric-gradient" />

      {/* Clear Sky (Day) */}
      {effectiveCondition === 'clear' && isDaytime && (
        <div className="atmosphere-elements clear-sky">
          <div className="sun-glow" />
          <div className="sun-rays" />
        </div>
      )}

      {/* Clear Sky (Night) or Night modifier */}
      {(!isDaytime || effectiveCondition === 'night') && (
        <div className="atmosphere-elements night-sky">
          <div className="moon-glow" />
          <div className="star star-1" />
          <div className="star star-2" />
          <div className="star star-3" />
          <div className="star star-4" />
        </div>
      )}

      {/* Partly Cloudy */}
      {effectiveCondition === 'partly-cloudy' && (
        <div className="atmosphere-elements cloudy-sky">
          {isDaytime ? <div className="sun-glow dim" /> : <div className="moon-glow dim" />}
          <div className="cloud cloud-front" />
        </div>
      )}

      {/* Cloudy / Overcast */}
      {effectiveCondition === 'cloudy' && (
        <div className="atmosphere-elements cloudy-sky">
          <div className="cloud cloud-back" />
          <div className="cloud cloud-front" />
        </div>
      )}

      {/* Rain / Drizzle / Freezing Rain */}
      {isRaining && (
        <div className="atmosphere-elements rain-sky">
          <div className="cloud rain-cloud" />
          <div className="raindrops">
            <span className="drop drop-1" />
            <span className="drop drop-2" />
            <span className="drop drop-3" />
            <span className="drop drop-4" />
            {effectiveCondition === 'heavy-rain' && (
              <>
                <span className="drop drop-5" />
                <span className="drop drop-6" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Thunderstorm */}
      {effectiveCondition === 'thunderstorm' && (
        <div className="atmosphere-elements storm-sky">
          <div className="storm-flash" />
          <div className="cloud storm-cloud" />
          <div className="raindrops heavy">
            <span className="drop drop-1" />
            <span className="drop drop-2" />
            <span className="drop drop-3" />
          </div>
        </div>
      )}

      {/* Snow */}
      {effectiveCondition === 'snow' && (
        <div className="atmosphere-elements snow-sky">
          <div className="snowflake flake-1">❄</div>
          <div className="snowflake flake-2">❅</div>
          <div className="snowflake flake-3">❆</div>
        </div>
      )}

      {/* Fog */}
      {effectiveCondition === 'fog' && (
        <div className="atmosphere-elements fog-sky">
          <div className="fog-mist fog-1" />
          <div className="fog-mist fog-2" />
        </div>
      )}
    </div>
  );
};
