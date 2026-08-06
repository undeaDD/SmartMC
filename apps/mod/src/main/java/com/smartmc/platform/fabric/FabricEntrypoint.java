package com.smartmc.platform.fabric;

//? fabric {

import com.smartmc.SmartMC;
import com.smartmc.command.SmartMcCommand;
import dev.kikugie.fletching_table.annotation.fabric.Entrypoint;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;

@Entrypoint("main")
public class FabricEntrypoint implements ModInitializer {

	@Override
	public void onInitialize() {
		SmartMC.onInitialize();
		ServerLifecycleEvents.SERVER_STARTING.register(SmartMC::onServerStarting);
		ServerLifecycleEvents.SERVER_STOPPING.register(server -> SmartMC.onServerStopping());
		CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> SmartMcCommand.register(dispatcher));
	}
}
//?}
