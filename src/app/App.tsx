import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlatformAdminProvider } from '@/contexts/PlatformAdminContext';
import { theme } from '@/theme/mui-theme';
import { isSupabaseConfigured } from '@/lib/env';
import ConfigMissingScreen from '@/components/system/ConfigMissingScreen';
import { AppRoutes } from '@/app/AppRoutes';

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfigMissingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <PlatformAdminProvider>
            <AppRoutes />
          </PlatformAdminProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
