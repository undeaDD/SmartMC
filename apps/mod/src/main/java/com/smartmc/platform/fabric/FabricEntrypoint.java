package com.smartmc.platform.fabric;

//? fabric {

import com.smartmc.SmartMC;
import dev.kikugie.fletching_table.annotation.fabric.Entrypoint;
import net.fabricmc.api.ModInitializer;

@Entrypoint("main")
public class FabricEntrypoint implements ModInitializer {

	@Override
	public void onInitialize() {
		SmartMC.onInitialize();
	}
}
//?}
