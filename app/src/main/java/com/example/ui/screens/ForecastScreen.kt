package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 28.dp)
    ) {
        // Compact Pill Tab Selector
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(CardSurface)
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                TabButton(
                    title = "7-Day Outlook",
                    isSelected = selectedSubTab == ForecastSubTab.SEVEN_DAY,
                    onClick = { selectedSubTab = ForecastSubTab.SEVEN_DAY },
                    modifier = Modifier.weight(1f).testTag("tab_7day_outlook")
                )
                TabButton(
                    title = "Weather Archive",
                    isSelected = selectedSubTab == ForecastSubTab.HISTORY,
                    onClick = { selectedSubTab = ForecastSubTab.HISTORY },
                    modifier = Modifier.weight(1f).testTag("tab_weather_archive")
                )
            }
        }

        if (selectedSubTab == ForecastSubTab.SEVEN_DAY) {
            item {
                Text(
                    text = "7-DAY SYNOPTIC FORECAST",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = SkyCyan,
                    letterSpacing = 0.8.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            items(weather.daily) { daily ->
                DailyForecastCard(daily = daily, viewModel = viewModel)
            }
        } else {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(top = 2.dp)) {
                    Text(
                        text = "HISTORICAL ARCHIVE (PAST 7 DAYS)",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = SunGold,
                        letterSpacing = 0.8.sp
                    )
                    Text(
                        text = "Observed temperatures for ${weather.city.name}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }
            }

            items(weather.historical) { history ->
                HistoricalDayCard(history = history, viewModel = viewModel)
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
            .height(34.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) SkyBlue else Color.Transparent)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) TextPrimary else TextSecondary,
            fontSize = 12.sp
        )
    }
}

@Composable
fun DailyForecastCard(
    daily: DailyForecast,
    viewModel: WeatherViewModel
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier.fillMaxWidth().testTag("daily_card_${daily.dayName}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.width(96.dp)) {
                Text(
                    text = daily.dayName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = daily.condition,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = getWeatherIconVector(daily.weatherCode),
                    contentDescription = daily.condition,
                    tint = if (daily.weatherCode == 0) SunGold else SkyCyan,
                    modifier = Modifier.size(20.dp)
                )

                if (daily.rainSum > 0.0) {
                    Text(
                        text = "${daily.rainSum}mm",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = SkyCyan
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = viewModel.formatTemp(daily.tempMax),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = viewModel.formatTemp(daily.tempMin),
                    style = MaterialTheme.typography.bodySmall,
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
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.width(96.dp)) {
                Text(
                    text = history.dayName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = history.date,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = getWeatherIconVector(history.weatherCode),
                    contentDescription = null,
                    tint = if (history.weatherCode == 0) SunGold else SkyCyan,
                    modifier = Modifier.size(20.dp)
                )

                if (history.precipitation > 0.0) {
                    Text(
                        text = "${history.precipitation}mm",
                        fontSize = 10.sp,
                        color = SkyCyan
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = viewModel.formatTemp(history.tempMax),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = viewModel.formatTemp(history.tempMin),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        }
    }
}
