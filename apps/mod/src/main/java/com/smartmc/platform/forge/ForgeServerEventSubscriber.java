package com.smartmc.platform.forge;

//? forge {

/*import com.smartmc.SmartMC;
import com.smartmc.command.SmartMcCommand;
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.event.server.ServerStoppingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = SmartMC.MOD_ID)
public class ForgeServerEventSubscriber {

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
