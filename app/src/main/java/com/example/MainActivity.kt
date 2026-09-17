package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.AppTab
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.WeatherViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                WeatherAppContent()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeatherAppContent(
    viewModel: WeatherViewModel = viewModel()
) {
    val selectedCity by viewModel.selectedCity.collectAsStateWithLifecycle()
    val weatherData by viewModel.weatherData.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val activeTab by viewModel.activeTab.collectAsStateWithLifecycle()
    val favoriteCities by viewModel.favoriteCities.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val tempUnit by viewModel.tempUnit.collectAsStateWithLifecycle()
    val windUnit by viewModel.windUnit.collectAsStateWithLifecycle()

    // Refresh animation rotation
    val infiniteTransition = rememberInfiniteTransition(label = "refresh_rotate")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotate_angle"
    )

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepNavy),
        containerColor = DeepNavy,
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF0F172A))
                                .border(1.dp, SkyCyan, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Cloud,
                                contentDescription = "App Icon",
                                tint = SkyCyan,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Amit Meena Weather",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "${selectedCity.name}, ${selectedCity.country}",
                                style = MaterialTheme.typography.labelSmall,
                                color = SkyCyan
                            )
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.refreshWeather() },
                        modifier = Modifier.testTag("refresh_weather_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = stringResource(R.string.refresh_weather),
                            tint = SkyCyan,
                            modifier = if (isLoading) Modifier.rotate(rotation) else Modifier
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeepSurface,
                    titleContentColor = TextPrimary
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = DeepSurface,
                tonalElevation = 8.dp,
                modifier = Modifier.testTag("main_bottom_nav")
            ) {
                NavigationBarItem(
                    selected = activeTab == AppTab.TODAY,
                    onClick = { viewModel.setActiveTab(AppTab.TODAY) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.TODAY) Icons.Default.CloudQueue else Icons.Outlined.CloudQueue,
                            contentDescription = stringResource(R.string.tab_today)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_today)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_today")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.FORECAST,
                    onClick = { viewModel.setActiveTab(AppTab.FORECAST) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.FORECAST) Icons.Default.CalendarMonth else Icons.Outlined.CalendarMonth,
                            contentDescription = stringResource(R.string.tab_forecast)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_forecast)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_forecast")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.AIR_QUALITY,
                    onClick = { viewModel.setActiveTab(AppTab.AIR_QUALITY) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.AIR_QUALITY) Icons.Default.Air else Icons.Outlined.Air,
                            contentDescription = stringResource(R.string.tab_aqi)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_aqi)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_aqi")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.CITIES,
                    onClick = { viewModel.setActiveTab(AppTab.CITIES) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.CITIES) Icons.Default.LocationCity else Icons.Outlined.LocationCity,
                            contentDescription = stringResource(R.string.tab_cities)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_cities)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_cities")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.SETTINGS,
                    onClick = { viewModel.setActiveTab(AppTab.SETTINGS) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.SETTINGS) Icons.Default.Settings else Icons.Outlined.Settings,
                            contentDescription = stringResource(R.string.tab_settings)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_settings)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_settings")
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            DeepNavy,
                            DeepSurface,
                            Color(0xFF070D1E)
                        )
                    )
                )
        ) {
            val currentWeather = weatherData
            if (currentWeather == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(
                            color = SkyCyan,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(48.dp)
                        )
                        Text(
                            text = "Loading Meteorological Data...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }
            } else {
                when (activeTab) {
                    AppTab.TODAY -> {
                        HomeScreen(
                            weather = currentWeather,
                            viewModel = viewModel,
                            onNavigateToForecast = { viewModel.setActiveTab(AppTab.FORECAST) }
                        )
                    }
                    AppTab.FORECAST -> {
                        ForecastScreen(
                            weather = currentWeather,
                            viewModel = viewModel
                        )
                    }
                    AppTab.AIR_QUALITY -> {
                        AirQualityScreen(
                            airQuality = currentWeather.airQuality,
                            cityName = currentWeather.city.name
                        )
                    }
                    AppTab.CITIES -> {
                        CitiesScreen(
                            viewModel = viewModel,
                            selectedCity = selectedCity,
                            favoriteCities = favoriteCities,
                            searchQuery = searchQuery,
                            searchResults = searchResults,
                            onCitySelected = { city -> viewModel.selectCity(city) }
                        )
                    }
                    AppTab.SETTINGS -> {
                        SettingsScreen(
                            viewModel = viewModel,
                            tempUnit = tempUnit,
                            windUnit = windUnit
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(text = "Hello $name!", modifier = modifier)
}

