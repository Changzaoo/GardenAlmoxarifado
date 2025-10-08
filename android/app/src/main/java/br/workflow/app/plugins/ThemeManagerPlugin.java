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
     * A barra de status permanece sempre azul (#2563eb)
     */
    private void updateStatusBar(String theme) {
        MainActivity activity = (MainActivity) getActivity();
        Window window = activity.getWindow();
        
        // Barra de status sempre azul com ícones brancos
        window.setStatusBarColor(Color.parseColor("#2563eb")); // Azul fixo (blue-600)
        
        // Barra de navegação muda com o tema
        if ("light".equals(theme)) {
            // Tema claro - barra de navegação branca
            window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                window.getDecorView().setSystemUiVisibility(
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                );
            }
        } else {
            // Tema escuro - barra de navegação preta
            window.setNavigationBarColor(Color.parseColor("#000000"));
            
            window.getDecorView().setSystemUiVisibility(0);
        }
    }
}
