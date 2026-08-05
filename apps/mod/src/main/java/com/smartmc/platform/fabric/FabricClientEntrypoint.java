package com.smartmc.platform.fabric;

//? fabric {

import com.smartmc.SmartMC;
import dev.kikugie.fletching_table.annotation.fabric.Entrypoint;
import net.fabricmc.api.ClientModInitializer;

@Entrypoint("client")
public class FabricClientEntrypoint implements ClientModInitializer {

	@Override
	public void onInitializeClient() {
		SmartMC.onInitializeClient();
	}

}
//?}
