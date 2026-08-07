plugins {
	id("mod-platform")
	id("net.neoforged.moddev.legacyforge")
}

stonecutter {
	val (version, loader) = current.project.split('-', limit = 2)
	properties.tags(version, loader)
}

platform {
	loader = "forge"
	dependencies {
		required("minecraft") {
			forgeLikeVersionRange = prop("deps.minecraft")
		}
		required("forge") {
			forgeLikeVersionRange.set("[1,)")
		}
	}
}

legacyForge {
	version = "${prop("deps.minecraft")}-${prop("deps.forge")}"
	accessTransformers.from(rootProject.file("src/main/resources/aw/${stonecutter.current.version}.cfg"))
	validateAccessTransformers = true

	if (hasProperty("deps.parchment")) parchment {
		val (mc, ver) = prop("deps.parchment").split(':')
		mappingsVersion = ver
		minecraftVersion = mc
	}

	runs {
		register("client") {
			client()
			gameDirectory = file("run/")
			ideName = "Forge Client (${stonecutter.current.version})"
			programArgument("--username=Dev")
		}
		register("server") {
			server()
			gameDirectory = file("run/")
			ideName = "Forge Server (${stonecutter.current.version})"
		}
	}

	mods {
		register(prop("mod.id")) {
			sourceSet(sourceSets["main"])
		}
	}
}

repositories {
	mavenCentral()
	strictMaven("https://api.modrinth.com/maven", "maven.modrinth") { name = "Modrinth" }
	strictMaven("https://jitpack.io", "com.github.jchambers") { name = "Jitpack" }
	// No FTB Teams dependency here on purpose -- see FtbTeamsGroupProvider's
	// javadoc: no compatible ftb-teams artifact is pinned for this legacy
	// 1.19.2/1.20.1 target, so that integration is fabric/neoforge-only for now.
}

dependencies {
	implementation(libs.h2)
	jarJar(libs.h2)
	implementation(libs.java.noise)
	jarJar(libs.java.noise)
}

tasks.named("createMinecraftArtifacts") {
	dependsOn(tasks.named("stonecutterGenerate"))
}
