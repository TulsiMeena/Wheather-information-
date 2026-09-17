package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.DailyForecast
import com.example.data.model.HourlyForecast
import com.example.data.model.WeatherData
import com.example.ui.theme.*
import com.example.ui.viewmodel.WeatherViewModel

@Composable
fun HomeScreen(
    weather: WeatherData,
    viewModel: WeatherViewModel,
    onRequestLocationPermission: () -> Unit,
    onNavigateToForecast: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val hasLocationPermission by viewModel.hasLocationPermission.collectAsStateWithLifecycle()
    val isLocating by viewModel.isLocating.collectAsStateWithLifecycle()
    val isCurrentLocation by viewModel.isCurrentLocationSelected.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 28.dp)
    ) {
        // Location Permission Banner (If not yet granted)
        if (!hasLocationPermission) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0x280284C7)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SkyCyan.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("location_permission_banner")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MyLocation,
                                contentDescription = null,
                                tint = SkyCyan,
                                modifier = Modifier.size(20.dp)
                            )
                            Column {
                                Text(
                                    text = "Enable exact location",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Get live local weather for where you are",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Button(
                            onClick = onRequestLocationPermission,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SkyCyan,
                                contentColor = DeepNavy
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text("Allow", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Google Weather Style Compact Hero
        item {
            GoogleWeatherHero(
                weather = weather,
                viewModel = viewModel,
                isCurrentLocation = isCurrentLocation,
                isLocating = isLocating,
                onFetchGpsLocation = { viewModel.fetchCurrentLocation(context) }
            )
        }

        // Google Weather Style Hourly Carousel
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "HOURLY FORECAST",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = SkyCyan,
                        letterSpacing = 0.8.sp
                    )
                    TextButton(
                        onClick = onNavigateToForecast,
                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text(
                            text = "Next 7 Days →",
                            style = MaterialTheme.typography.labelSmall,
                            color = SkyCyan
                        )
                    }
                }

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 2.dp)
                ) {
                    items(weather.hourly) { hourly ->
                        GoogleHourlyCard(hourly = hourly, viewModel = viewModel)
                    }
                }
            }
        }

        // Google Weather Signature 7-Day Forecast Card with Temperature Bars
        item {
            GoogleWeeklyForecastCard(
                daily = weather.daily,
                viewModel = viewModel,
                onViewFull = onNavigateToForecast
            )
        }

        // 2-Column Google Weather Metrics Grid
        item {
            Text(
                text = "CURRENT CONDITIONS",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = SkyCyan,
                letterSpacing = 0.8.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CompactMetricTile(
                    title = "Wind",
                    value = viewModel.formatWind(weather.windSpeed),
                    subtitle = "Direction ${weather.windDirection}°",
                    icon = Icons.Outlined.Air,
                    modifier = Modifier.weight(1f)
                )
                CompactMetricTile(
                    title = "Humidity",
                    value = "${weather.humidity}%",
                    subtitle = "Dew point comfortable",
                    icon = Icons.Outlined.WaterDrop,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CompactMetricTile(
                    title = "UV Index",
                    value = "${weather.uvIndex}",
                    subtitle = if (weather.uvIndex >= 6) "Very High" else "Moderate",
                    icon = Icons.Outlined.WbSunny,
                    modifier = Modifier.weight(1f)
                )
                CompactMetricTile(
                    title = "Pressure",
                    value = "${Math.round(weather.pressure)} hPa",
                    subtitle = "Normal & steady",
                    icon = Icons.Outlined.Speed,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CompactMetricTile(
                    title = "Sunrise & Sunset",
                    value = "${weather.sunrise} • ${weather.sunset}",
                    subtitle = "Daylight 12h 16m",
                    icon = Icons.Outlined.WbTwilight,
                    modifier = Modifier.weight(1f)
                )
                CompactMetricTile(
                    title = "Air Quality",
                    value = "AQI ${weather.airQuality.aqi}",
                    subtitle = weather.airQuality.status,
                    icon = Icons.Outlined.Eco,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun GoogleWeatherHero(
    weather: WeatherData,
    viewModel: WeatherViewModel,
    isCurrentLocation: Boolean,
    isLocating: Boolean,
    onFetchGpsLocation: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("hero_weather_card")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header Location Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = if (isCurrentLocation) Icons.Default.NearMe else Icons.Default.LocationOn,
                        contentDescription = "Location",
                        tint = SkyCyan,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = weather.city.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    if (isCurrentLocation) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0x3338BDF8)
                        ) {
                            Text(
                                text = "GPS",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = SkyCyan,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                }

                IconButton(
                    onClick = onFetchGpsLocation,
                    modifier = Modifier
                        .size(32.dp)
                        .testTag("gps_locate_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.MyLocation,
                        contentDescription = "Update GPS Location",
                        tint = if (isLocating) SunGold else SkyCyan,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Temperature & Condition Row (Google Weather Layout)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = viewModel.formatTemp(weather.temperature),
                        fontSize = 54.sp,
                        fontWeight = FontWeight.Light,
                        color = TextPrimary,
                        letterSpacing = (-1).sp
                    )
                    Text(
                        text = weather.condition,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Text(
                        text = "H: ${viewModel.formatTemp(weather.tempMax)} • L: ${viewModel.formatTemp(weather.tempMin)} • Feels like ${viewModel.formatTemp(weather.feelsLike)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(Color(0x3338BDF8), Color(0x050284C7))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = getWeatherIconVector(weather.weatherCode),
                        contentDescription = weather.condition,
                        tint = if (weather.weatherCode in listOf(0, 1)) SunGold else SkyCyan,
                        modifier = Modifier.size(42.dp)
                    )
                }
            }

            // Subtle Status Pill Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0x18FFFFFF)
                ) {
                    Text(
                        text = "AQI ${weather.airQuality.aqi} • ${weather.airQuality.status}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = getAqiColor(weather.airQuality.aqi),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }

                Text(
                    text = weather.lastUpdated,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun GoogleHourlyCard(
    hourly: HourlyForecast,
    viewModel: WeatherViewModel
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier
            .width(58.dp)
            .height(96.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = hourly.hourLabel,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = TextSecondary
            )

            Icon(
                imageVector = getWeatherIconVector(hourly.weatherCode),
                contentDescription = null,
                tint = if (hourly.weatherCode in listOf(0, 1)) SunGold else SkyCyan,
                modifier = Modifier.size(22.dp)
            )

            if (hourly.precipitationProbability > 0) {
                Text(
                    text = "${hourly.precipitationProbability}%",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = SkyCyan
                )
            }

            Text(
                text = viewModel.formatTemp(hourly.temperature),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }
    }
}

@Composable
fun GoogleWeeklyForecastCard(
    daily: List<DailyForecast>,
    viewModel: WeatherViewModel,
    onViewFull: () -> Unit
) {
    val overallMin = daily.minOfOrNull { it.tempMin } ?: 15.0
    val overallMax = daily.maxOfOrNull { it.tempMax } ?: 35.0
    val tempRange = (overallMax - overallMin).coerceAtLeast(1.0)

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("google_weekly_card")
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "7-DAY OUTLOOK",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = SkyCyan,
                    letterSpacing = 0.8.sp
                )
                Text(
                    text = "High / Low Range",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }

            daily.take(7).forEach { day ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Day Name
                    Text(
                        text = day.dayName.split(",").firstOrNull() ?: day.dayName,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary,
                        modifier = Modifier.width(52.dp)
                    )

                    // Weather Icon & rain chance
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.width(44.dp)
                    ) {
                        Icon(
                            imageVector = getWeatherIconVector(day.weatherCode),
                            contentDescription = null,
                            tint = if (day.weatherCode in listOf(0, 1)) SunGold else SkyCyan,
                            modifier = Modifier.size(18.dp)
                        )
                        if (day.rainSum > 0.5) {
                            Text(
                                text = "💧",
                                fontSize = 9.sp
                            )
                        }
                    }

                    // Low temp
                    Text(
                        text = viewModel.formatTemp(day.tempMin),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = TextSecondary,
                        modifier = Modifier.width(32.dp)
                    )

                    // Google Weather signature horizontal gradient temperature bar
                    val startFraction = ((day.tempMin - overallMin) / tempRange).toFloat().coerceIn(0f, 1f)
                    val endFraction = ((day.tempMax - overallMin) / tempRange).toFloat().coerceIn(0f, 1f)

                    Canvas(
                        modifier = Modifier
                            .weight(1f)
                            .height(6.dp)
                            .padding(horizontal = 6.dp)
                    ) {
                        val w = size.width
                        val h = size.height
                        val radius = CornerRadius(h / 2f, h / 2f)

                        // Track background
                        drawRoundRect(
                            color = Color(0x28FFFFFF),
                            size = Size(w, h),
                            cornerRadius = radius
                        )

                        // Active gradient range
                        val startX = (startFraction * w).coerceIn(0f, w - 8f)
                        val endX = (endFraction * w).coerceIn(startX + 8f, w)
                        val barWidth = (endX - startX).coerceAtLeast(8f)

                        drawRoundRect(
                            brush = Brush.horizontalGradient(
                                colors = listOf(SkyCyan, SunGold),
                                startX = startX,
                                endX = endX
                            ),
                            topLeft = Offset(startX, 0f),
                            size = Size(barWidth, h),
                            cornerRadius = radius
                        )
                    }

                    // High temp
                    Text(
                        text = viewModel.formatTemp(day.tempMax),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        modifier = Modifier.width(32.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun CompactMetricTile(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = SkyCyan,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }

            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
    }
}

fun getWeatherIconVector(code: Int): ImageVector {
    return when (code) {
        0 -> Icons.Default.WbSunny
        1, 2 -> Icons.Default.WbCloudy
        3 -> Icons.Default.Cloud
        45, 48 -> Icons.Default.Foggy
        51, 53, 55, 61, 63, 65 -> Icons.Default.WaterDrop
        80, 81, 82 -> Icons.Default.Thunderstorm
        else -> Icons.Default.CloudQueue
    }
}

fun getAqiColor(aqi: Int): Color {
    return when {
        aqi <= 50 -> AqiGreen
        aqi <= 100 -> AqiYellow
        aqi <= 150 -> AqiOrange
        else -> AqiRed
    }
}
