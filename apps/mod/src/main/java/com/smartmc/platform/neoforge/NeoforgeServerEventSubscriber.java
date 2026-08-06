package com.smartmc.platform.neoforge;

//? neoforge {

/*import com.smartmc.SmartMC;
import com.smartmc.command.SmartMcCommand;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.RegisterCommandsEvent;
import net.neoforged.neoforge.event.server.ServerStartingEvent;
import net.neoforged.neoforge.event.server.ServerStoppingEvent;

// bus() defaults to GAME (confirmed via bytecode -- the attribute itself is
// deprecated but its default is exactly what these two game-bus events need,
// so it's left unspecified here rather than referencing the deprecated API).
@EventBusSubscriber(modid = SmartMC.MOD_ID)
public class NeoforgeServerEventSubscriber {

	@SubscribeEvent
	public static void onServerStarting(ServerStartingEvent event) {
		SmartMC.onServerStarting(event.getServer());
	}

	@SubscribeEvent
	public static void onServerStopping(ServerStoppingEvent event) {
		SmartMC.onServerStopping();
	}

	@SubscribeEvent
	public static void onRegisterCommands(RegisterCommandsEvent event) {
		SmartMcCommand.register(event.getDispatcher());
	}
}
*///?}
