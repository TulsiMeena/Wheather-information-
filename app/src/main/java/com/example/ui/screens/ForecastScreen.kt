package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DailyForecast
import com.example.data.model.HistoricalDay
import com.example.data.model.WeatherData
import com.example.ui.theme.*
import com.example.ui.viewmodel.WeatherViewModel

enum class ForecastSubTab {
    SEVEN_DAY,
    HISTORY
}

@Composable
fun ForecastScreen(
    weather: WeatherData,
    viewModel: WeatherViewModel,
    modifier: Modifier = Modifier
) {
    var selectedSubTab by remember { mutableStateOf(ForecastSubTab.SEVEN_DAY) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 32.dp)
    ) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(CardSurface)
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                TabButton(
                    title = "7-Day Outlook",
                    isSelected = selectedSubTab == ForecastSubTab.SEVEN_DAY,
                    onClick = { selectedSubTab = ForecastSubTab.SEVEN_DAY },
                    modifier = Modifier.weight(1f).testTag("tab_7day_outlook")
                )
                TabButton(
                    title = "Weather Archive (इतिहास)",
                    isSelected = selectedSubTab == ForecastSubTab.HISTORY,
                    onClick = { selectedSubTab = ForecastSubTab.HISTORY },
                    modifier = Modifier.weight(1f).testTag("tab_weather_archive")
                )
            }
        }

        if (selectedSubTab == ForecastSubTab.SEVEN_DAY) {
            item {
                Text(
                    text = "UPCOMING 7-DAY SYNOPTIC OUTLOOK",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = SkyCyan,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                )
            }

            items(weather.daily) { daily ->
                DailyForecastCard(daily = daily, viewModel = viewModel)
            }
        } else {
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "HISTORICAL WEATHER ARCHIVE (PAST 7 DAYS)",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = SunGold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                    )
                    Text(
                        text = "Recorded meteorological trends for ${weather.city.name}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }

            items(weather.historical) { history ->
                HistoricalDayCard(history = history, viewModel = viewModel)
            }

            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = CardSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Timeline,
                                contentDescription = null,
                                tint = SkyCyan,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "ERA5 Synoptic Analysis",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                        Text(
                            text = "Historical temperatures show consistent seasonal trends for ${weather.city.name}. Data validated against ECMWF meteorological reanalysis.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TabButton(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) SkyBlue else Color.Transparent)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) TextPrimary else TextSecondary
        )
    }
}

@Composable
fun DailyForecastCard(
    daily: DailyForecast,
    viewModel: WeatherViewModel
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier.fillMaxWidth().testTag("daily_card_${daily.dayName}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.width(100.dp)) {
                Text(
                    text = daily.dayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = daily.condition,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = getWeatherIcon(daily.weatherCode),
                    contentDescription = daily.condition,
                    tint = if (daily.weatherCode == 0) SunGold else SkyCyan,
                    modifier = Modifier.size(28.dp)
                )

                if (daily.rainSum > 0.0) {
                    Text(
                        text = "${daily.rainSum}mm",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = SkyCyan
                    )
                }
            }

            // High & Low Values
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = viewModel.formatTemp(daily.tempMax),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = viewModel.formatTemp(daily.tempMin),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
fun HistoricalDayCard(
    history: HistoricalDay,
    viewModel: WeatherViewModel
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier.fillMaxWidth().testTag("history_card_${history.dayName}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = history.dayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Mean: ${viewModel.formatTemp(history.tempMean)} • ${history.condition}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "H: ${viewModel.formatTemp(history.tempMax)}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = SunOrange
                    )
                    Text(
                        text = "L: ${viewModel.formatTemp(history.tempMin)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SkyCyan
                    )
                }
                if (history.rainSum > 0.0) {
                    Text(
                        text = "Rain: ${history.rainSum} mm",
                        style = MaterialTheme.typography.labelSmall,
                        color = SkyCyan
                    )
                }
            }
        }
    }
}
