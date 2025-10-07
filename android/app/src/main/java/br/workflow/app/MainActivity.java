package br.workflow.app;

import android.os.Bundle;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String PREFS_NAME = "WorkflowPrefs";
    private static final String THEME_KEY = "workflow-theme";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Aplica o tema antes de super.onCreate
        applyTheme();
        
        super.onCreate(savedInstanceState);
        
        // Configura a janela para edge-to-edge
        setupWindow();
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // Reaplica o tema quando o app volta ao foreground
        applyTheme();
        updateStatusBar();
    }
    
    /**
     * Aplica o tema baseado na preferência salva
     */
    private void applyTheme() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String theme = prefs.getString(THEME_KEY, "dark");
        
        if ("light".equals(theme)) {
            setTheme(R.style.AppTheme_Light);
        } else {
            setTheme(R.style.AppTheme_Dark);
        }
    }
    
    /**
     * Configura a janela para melhor integração com o sistema
     */
    private void setupWindow() {
        Window window = getWindow();
        
        // Permite desenhar conteúdo atrás da barra de status
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Remove bandeira de translucidez se existir
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        
        // Atualiza cores das barras do sistema
        updateStatusBar();
    }
    
    /**
     * Atualiza as cores da barra de status e navegação
     */
    private void updateStatusBar() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String theme = prefs.getString(THEME_KEY, "dark");
        
        Window window = getWindow();
        
        if ("light".equals(theme)) {
            // Tema claro: fundo branco, ícones escuros
            window.setStatusBarColor(Color.parseColor("#FFFFFF"));
            window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
            
            // Ícones da barra de status em preto (API 23+)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                window.getDecorView().setSystemUiVisibility(
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | 
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                );
            }
        } else {
            // Tema escuro: fundo preto, ícones claros
            window.setStatusBarColor(Color.parseColor("#000000"));
            window.setNavigationBarColor(Color.parseColor("#000000"));
            
            // Remove flags de light mode
            window.getDecorView().setSystemUiVisibility(0);
        }
    }
    
    /**
     * Método público para ser chamado via JavaScript/Capacitor
     * Atualiza o tema em tempo real
     */
    public void updateTheme(String theme) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(THEME_KEY, theme);
        editor.apply();
        
        // Recria a activity para aplicar o novo tema
        runOnUiThread(() -> {
            updateStatusBar();
        });
    }
}
