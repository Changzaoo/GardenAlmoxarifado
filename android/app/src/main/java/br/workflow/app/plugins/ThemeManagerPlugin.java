package br.workflow.app.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.Window;

import br.workflow.app.MainActivity;

@CapacitorPlugin(name = "ThemeManager")
public class ThemeManagerPlugin extends Plugin {
    
    private static final String PREFS_NAME = "WorkflowPrefs";
    private static final String THEME_KEY = "workflow-theme";
    
    /**
     * Atualiza o tema do aplicativo em tempo real
     */
    @PluginMethod
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme", "dark");
        
        // Salva a preferência
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, getContext().MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(THEME_KEY, theme);
        editor.apply();
        
        // Atualiza a UI imediatamente
        getActivity().runOnUiThread(() -> {
            updateStatusBar(theme);
        });
        
        call.resolve();
    }
    
    /**
     * Obtém o tema atual
     */
    @PluginMethod
    public void getTheme(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, getContext().MODE_PRIVATE);
        String theme = prefs.getString(THEME_KEY, "dark");
        
        call.resolve(new com.getcapacitor.JSObject().put("theme", theme));
    }
    
    /**
     * Atualiza as cores da barra de status e navegação
     */
    private void updateStatusBar(String theme) {
        MainActivity activity = (MainActivity) getActivity();
        Window window = activity.getWindow();
        
        if ("light".equals(theme)) {
            // Tema claro
            window.setStatusBarColor(Color.parseColor("#FFFFFF"));
            window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                window.getDecorView().setSystemUiVisibility(
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | 
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                );
            }
        } else {
            // Tema escuro
            window.setStatusBarColor(Color.parseColor("#000000"));
            window.setNavigationBarColor(Color.parseColor("#000000"));
            
            window.getDecorView().setSystemUiVisibility(0);
        }
    }
}
