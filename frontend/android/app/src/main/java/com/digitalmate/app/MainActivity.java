package com.digitalmate.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DigitalMatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
