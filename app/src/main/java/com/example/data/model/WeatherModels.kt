package com.example.data.model

data class City(
    val id: String,
    val name: String,
    val country: String,
    val lat: Double,
    val lon: Double,
    val isFavorite: Boolean = false
)

data class HourlyForecast(
    val time: String,
    val hourLabel: String,
    val temp: Double,
    val weatherCode: Int,
    val condition: String,
    val precipProb: Int
) {
    val temperature: Double get() = temp
    val precipitationProbability: Int get() = precipProb
}

data class DailyForecast(
    val date: String,
    val dayName: String,
    val weatherCode: Int,
    val condition: String,
    val tempMax: Double,
    val tempMin: Double,
    val rainSum: Double,
    val uvIndex: Double
)

data class HistoricalDay(
    val date: String,
    val dayName: String,
    val tempMax: Double,
    val tempMin: Double,
    val tempMean: Double,
    val condition: String,
    val rainSum: Double,
    val weatherCode: Int = 0,
    val precipitation: Double = rainSum
)

data class AirQualityData(
    val aqi: Int,
    val aqiCategory: String,
    val pm25: Double,
    val pm10: Double,
    val o3: Double,
    val no2: Double,
    val co: Double,
    val healthAdvice: String
) {
    val status: String get() = aqiCategory
}

data class WeatherData(
    val city: City,
    val temperature: Double,
    val feelsLike: Double,
    val condition: String,
    val weatherCode: Int,
    val tempMax: Double,
    val tempMin: Double,
    val humidity: Int,
    val windSpeed: Double,
    val windDirection: Int,
    val pressure: Double,
    val uvIndex: Double,
    val visibilityKm: Double,
    val sunrise: String,
    val sunset: String,
    val hourly: List<HourlyForecast>,
    val daily: List<DailyForecast>,
    val historical: List<HistoricalDay>,
    val airQuality: AirQualityData,
    val lastUpdated: String
)

enum class TemperatureUnit(val symbol: String) {
    CELSIUS("°C"),
    FAHRENHEIT("°F")
}

enum class WindSpeedUnit(val symbol: String) {
    KMH("km/h"),
    MPH("mph")
}

enum class AppTab {
    TODAY,
    FORECAST,
    AIR_QUALITY,
    CITIES,
    SETTINGS
}
