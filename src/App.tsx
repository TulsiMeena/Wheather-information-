import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Header } from './components/common/Header';
import { BottomNavigation, DesktopNavigationRail } from './components/navigation/Navigation';
import { LocationSearchModal } from './components/modals/LocationSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { WeatherVisual } from './components/weather/WeatherVisual';
import { Footer } from './components/common/Footer';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { InstallPrompt } from './components/common/InstallPrompt';

// Pages
import { HomePage } from './pages/HomePage';
import { HourlyPage } from './pages/HourlyPage';
import { ForecastPage } from './pages/ForecastPage';
import { DetailsPage } from './pages/DetailsPage';
import { MapPage } from './pages/MapPage';
import { AirQualityPage } from './pages/AirQualityPage';
import { AlertsPage } from './pages/AlertsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AssistantPage } from './pages/AssistantPage';
import { HistoryPage } from './pages/HistoryPage';
import { DiagnosticsModal } from './components/diagnostics/DiagnosticsModal';

import './App.css';

const AppShell: React.FC = () => {
  const { activePage, currentWeather, isDiagnosticsOpen, setIsDiagnosticsOpen } = useApp();

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'hourly':
        return <HourlyPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'details':
        return <DetailsPage />;
      case 'map':
        return <MapPage />;
      case 'history':
        return <HistoryPage />;
      case 'airquality':
        return <AirQualityPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'assistant':
        return <AssistantPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-layout">
      {/* Cinematic Dynamic Atmospheric Visual Backdrop */}
      <WeatherVisual condition={currentWeather?.condition} isDaytime={currentWeather?.isDaytime} />

      {/* Desktop Sidebar Navigation Rail */}
      <DesktopNavigationRail />

      {/* Main Content Viewport */}
      <div className="app-main-viewport">
        <Header />
        <main className="content-region" role="main">
          {renderActivePage()}
        </main>
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Modals, Drawers & Portals */}
      <LocationSearchModal />
      <NotificationCenter />
      <InstallPrompt />
      <ToastContainer />
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
