import {
  DailyForecastItem,
  HistoricalDataPoint,
  HistoricalStatistics,
  PeriodRecordItem,
  PeriodSummary,
  ForecastVsHistoryComparison,
  TemperatureUnit,
  WindSpeedUnit
} from '../../types/weather';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';

export class HistoryAnalytics {
  /**
   * Calculate rigorous statistics from actual historical data.
   * Missing or null values are strictly filtered out and never treated as zero.
   */
  static calculateStatistics(daily: HistoricalDataPoint[]): HistoricalStatistics {
    if (!daily || daily.length === 0) {
      return {
        avgTemp: null,
        maxTemp: null,
        minTemp: null,
        avgHumidity: null,
        totalPrecipitation: null,
        maxWind: null,
        avgWind: null,
        avgCloudCover: null,
        maxUv: null,
        totalDays: 0,
        validDaysCount: 0
      };
    }

    const validTemps: number[] = [];
    const validMaxTemps: number[] = [];
    const validMinTemps: number[] = [];
    const validPrecip: number[] = [];
    const validWinds: number[] = [];
    const validHumidities: number[] = [];
    const validClouds: number[] = [];
    const validUvs: number[] = [];

    for (const d of daily) {
      if (d.temperatureMean !== null && !isNaN(d.temperatureMean)) {
        validTemps.push(d.temperatureMean);
      }
      if (d.temperatureMax !== null && !isNaN(d.temperatureMax)) {
        validMaxTemps.push(d.temperatureMax);
      }
      if (d.temperatureMin !== null && !isNaN(d.temperatureMin)) {
        validMinTemps.push(d.temperatureMin);
      }
      if (d.precipitationSum !== null && !isNaN(d.precipitationSum)) {
        validPrecip.push(d.precipitationSum);
      }
      if (d.windSpeedMax !== null && !isNaN(d.windSpeedMax)) {
        validWinds.push(d.windSpeedMax);
      }
      if (d.humidityMean !== null && d.humidityMean !== undefined && !isNaN(d.humidityMean)) {
        validHumidities.push(d.humidityMean);
      }
      if (d.cloudCoverMean !== null && d.cloudCoverMean !== undefined && !isNaN(d.cloudCoverMean)) {
        validClouds.push(d.cloudCoverMean);
      }
      if (d.uvIndexMax !== null && d.uvIndexMax !== undefined && !isNaN(d.uvIndexMax)) {
        validUvs.push(d.uvIndexMax);
      }
    }

    const avgTemp = validTemps.length > 0
      ? Math.round((validTemps.reduce((a, b) => a + b, 0) / validTemps.length) * 10) / 10
      : null;

    const maxTemp = validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : null;
    const minTemp = validMinTemps.length > 0 ? Math.min(...validMinTemps) : null;

    const totalPrecipitation = validPrecip.length > 0
      ? Math.round(validPrecip.reduce((a, b) => a + b, 0) * 10) / 10
      : null;

    const maxWind = validWinds.length > 0 ? Math.max(...validWinds) : null;
    const avgWind = validWinds.length > 0
      ? Math.round((validWinds.reduce((a, b) => a + b, 0) / validWinds.length) * 10) / 10
      : null;

    const avgHumidity = validHumidities.length > 0
      ? Math.round(validHumidities.reduce((a, b) => a + b, 0) / validHumidities.length)
      : null;

    const avgCloudCover = validClouds.length > 0
      ? Math.round(validClouds.reduce((a, b) => a + b, 0) / validClouds.length)
      : null;

    const maxUv = validUvs.length > 0 ? Math.max(...validUvs) : null;

    return {
      avgTemp,
      maxTemp,
      minTemp,
      avgHumidity,
      totalPrecipitation,
      maxWind,
      avgWind,
      avgCloudCover,
      maxUv,
      totalDays: daily.length,
      validDaysCount: validTemps.length
    };
  }

  /**
   * Determine period records ("Highest in selected period")
   */
  static calculateRecords(
    daily: HistoricalDataPoint[],
    locationName: string,
    tempUnit: TemperatureUnit,
    windUnit: WindSpeedUnit
  ): PeriodRecordItem[] {
    const records: PeriodRecordItem[] = [];
    if (!daily || daily.length === 0) return records;

    // 1. Highest Temperature
    let highestTempDay: HistoricalDataPoint | null = null;
    for (const d of daily) {
      if (d.temperatureMax !== null) {
        if (!highestTempDay || highestTempDay.temperatureMax === null || d.temperatureMax > highestTempDay.temperatureMax) {
          highestTempDay = d;
        }
      }
    }
    if (highestTempDay && highestTempDay.temperatureMax !== null) {
      records.push({
        type: 'highest_temp',
        label: 'Highest Temperature in Period',
        value: highestTempDay.temperatureMax,
        formattedValue: formatTemperature(highestTempDay.temperatureMax, tempUnit),
        unit: `°${tempUnit}`,
        date: highestTempDay.date,
        location: locationName
      });
    }

    // 2. Lowest Temperature
    let lowestTempDay: HistoricalDataPoint | null = null;
    for (const d of daily) {
      if (d.temperatureMin !== null) {
        if (!lowestTempDay || lowestTempDay.temperatureMin === null || d.temperatureMin < lowestTempDay.temperatureMin) {
          lowestTempDay = d;
        }
      }
    }
    if (lowestTempDay && lowestTempDay.temperatureMin !== null) {
      records.push({
        type: 'lowest_temp',
        label: 'Lowest Temperature in Period',
        value: lowestTempDay.temperatureMin,
        formattedValue: formatTemperature(lowestTempDay.temperatureMin, tempUnit),
        unit: `°${tempUnit}`,
        date: lowestTempDay.date,
        location: locationName
      });
    }

    // 3. Highest Precipitation
    let wettestDay: HistoricalDataPoint | null = null;
    for (const d of daily) {
      if (d.precipitationSum !== null && d.precipitationSum > 0) {
        if (!wettestDay || wettestDay.precipitationSum === null || d.precipitationSum > wettestDay.precipitationSum) {
          wettestDay = d;
        }
      }
    }
    if (wettestDay && wettestDay.precipitationSum !== null) {
      records.push({
        type: 'highest_precipitation',
        label: 'Wettest 24h Period',
        value: wettestDay.precipitationSum,
        formattedValue: `${wettestDay.precipitationSum} mm`,
        unit: 'mm',
        date: wettestDay.date,
        location: locationName
      });
    }

    // 4. Strongest Wind
    let windiestDay: HistoricalDataPoint | null = null;
    for (const d of daily) {
      if (d.windSpeedMax !== null) {
        if (!windiestDay || windiestDay.windSpeedMax === null || d.windSpeedMax > windiestDay.windSpeedMax) {
          windiestDay = d;
        }
      }
    }
    if (windiestDay && windiestDay.windSpeedMax !== null) {
      records.push({
        type: 'strongest_wind',
        label: 'Strongest Wind Velocity',
        value: windiestDay.windSpeedMax,
        formattedValue: formatWindSpeed(windiestDay.windSpeedMax, windUnit),
        unit: windUnit,
        date: windiestDay.date,
        location: locationName
      });
    }

    return records;
  }

  /**
   * Produce high-level period summary
   */
  static calculatePeriodSummary(
    daily: HistoricalDataPoint[],
    stats: HistoricalStatistics,
    tempUnit: TemperatureUnit,
    windUnit: WindSpeedUnit
  ): PeriodSummary {
    const avgTempFormatted = stats.avgTemp !== null ? formatTemperature(stats.avgTemp, tempUnit) : '--';
    const totalPrecipFormatted = stats.totalPrecipitation !== null ? `${stats.totalPrecipitation} mm` : '--';

    let warmest: HistoricalDataPoint | null = null;
    let wettest: HistoricalDataPoint | null = null;
    let windiest: HistoricalDataPoint | null = null;

    for (const d of daily) {
      if (d.temperatureMax !== null && (!warmest || d.temperatureMax > (warmest.temperatureMax ?? -999))) {
        warmest = d;
      }
      if (d.precipitationSum !== null && d.precipitationSum > 0 && (!wettest || d.precipitationSum > (wettest.precipitationSum ?? -1))) {
        wettest = d;
      }
      if (d.windSpeedMax !== null && (!windiest || d.windSpeedMax > (windiest.windSpeedMax ?? -1))) {
        windiest = d;
      }
    }

    return {
      avgTempFormatted,
      totalPrecipFormatted,
      warmestDay: warmest && warmest.temperatureMax !== null
        ? { date: warmest.date, temp: formatTemperature(warmest.temperatureMax, tempUnit) }
        : null,
      wettestDay: wettest && wettest.precipitationSum !== null
        ? { date: wettest.date, precip: `${wettest.precipitationSum} mm` }
        : null,
      strongestWindDay: windiest && windiest.windSpeedMax !== null
        ? { date: windiest.date, wind: formatWindSpeed(windiest.windSpeedMax, windUnit) }
        : null
    };
  }

  /**
   * Compare Active 7-Day Forecast with Historical Period
   */
  static compareForecastVsHistory(
    dailyForecast: DailyForecastItem[],
    stats: HistoricalStatistics,
    historyLabel: string
  ): ForecastVsHistoryComparison | null {
    if (!dailyForecast || dailyForecast.length === 0 || stats.avgTemp === null) {
      return null;
    }

    const validForecastTemps = dailyForecast
      .map((d) => (d.highTemp !== null && d.lowTemp !== null ? (d.highTemp + d.lowTemp) / 2 : null))
      .filter((t): t is number => t !== null && !isNaN(t));

    const validForecastPrecip = dailyForecast
      .map((d) => d.precipitationSum)
      .filter((p): p is number => p !== null && p !== undefined && !isNaN(p));

    const validForecastWinds = dailyForecast
      .map((d) => d.windSpeedMax)
      .filter((w): w is number => w !== null && w !== undefined && !isNaN(w));

    const forecastAvgTemp = validForecastTemps.length > 0
      ? Math.round((validForecastTemps.reduce((a, b) => a + b, 0) / validForecastTemps.length) * 10) / 10
      : null;

    const forecastTotalPrecip = validForecastPrecip.length > 0
      ? Math.round(validForecastPrecip.reduce((a, b) => a + b, 0) * 10) / 10
      : null;

    const forecastAvgWind = validForecastWinds.length > 0
      ? Math.round((validForecastWinds.reduce((a, b) => a + b, 0) / validForecastWinds.length) * 10) / 10
      : null;

    const tempDiff = forecastAvgTemp !== null && stats.avgTemp !== null
      ? Math.round((forecastAvgTemp - stats.avgTemp) * 10) / 10
      : null;

    const precipDiff = forecastTotalPrecip !== null && stats.totalPrecipitation !== null
      ? Math.round((forecastTotalPrecip - stats.totalPrecipitation) * 10) / 10
      : null;

    const windDiff = forecastAvgWind !== null && stats.avgWind !== null
      ? Math.round((forecastAvgWind - stats.avgWind) * 10) / 10
      : null;

    return {
      historicalPeriodLabel: historyLabel,
      forecastPeriodLabel: `Upcoming ${dailyForecast.length} Days`,
      historyAvgTemp: stats.avgTemp,
      forecastAvgTemp,
      tempDiff,
      historyTotalPrecip: stats.totalPrecipitation,
      forecastTotalPrecip,
      precipDiff,
      historyAvgWind: stats.avgWind,
      forecastAvgWind,
      windDiff,
      disclaimer: 'Meteorological Notice: Comparative analysis between upcoming numerical model forecasts and historical baseline observations. Historical averages do not guarantee future synoptic patterns.'
    };
  }
}
