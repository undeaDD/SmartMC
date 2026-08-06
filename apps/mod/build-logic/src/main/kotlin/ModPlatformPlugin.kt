@file:Suppress("unused", "DuplicatedCode")

import dev.kikugie.fletching_table.extension.FletchingTableExtension
import dev.kikugie.stonecutter.StonecutterExperimentalAPI
import dev.kikugie.stonecutter.build.StonecutterBuildExtension
import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.dsl.RepositoryHandler
import org.gradle.api.artifacts.repositories.MavenArtifactRepository
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.testing.Test
import org.gradle.internal.extensions.stdlib.toDefaultLowerCase
import org.gradle.jvm.tasks.Jar
import org.gradle.kotlin.dsl.*
import org.gradle.language.jvm.tasks.ProcessResources
import org.gradle.plugins.ide.idea.model.IdeaModel
import java.util.Properties
import javax.inject.Inject

val Project.sc: StonecutterBuildExtension
	get() = extensions.getByType<StonecutterBuildExtension>()

@OptIn(StonecutterExperimentalAPI::class)
fun Project.prop(name: String): String = (project.sc.properties.get<String>(name))

fun Project.env(variable: String): String? {
	providers.environmentVariable(variable).orNull?.let { return it }
	return rootProject.file(".env").takeIf { it.exists() }?.let { f ->
		Properties().apply { f.inputStream().use(::load) }.getProperty(variable)
	}
}
fun Project.envTrue(variable: String): Boolean = env(variable)?.toDefaultLowerCase() == "true"

fun RepositoryHandler.strictMaven(
	url: String, vararg groups: String, configure: MavenArtifactRepository.() -> Unit = {}
) = exclusiveContent {
	forRepository { maven(url) { configure() } }
	filter { groups.forEach(::includeGroup) }
}

abstract class GenerateModManifestTask : DefaultTask() {
	@get:Input
	abstract val content: Property<String>

	@get:OutputFile
	abstract val outputFile: RegularFileProperty

	@TaskAction
	fun generate() {
		val file = outputFile.get().asFile
		file.parentFile.mkdirs()
		file.writeText(content.get())
	}
}

abstract class ModPlatformPlugin @Inject constructor() : Plugin<Project> {
	override fun apply(project: Project) = with(project) {
		val inferredLoader = Loader.of(project.buildFile.name.substringAfter('.').replace(".gradle.kts", ""))

		val extension = extensions.create("platform", ModPlatformExtension::class.java).apply {
			loader.convention(inferredLoader.id)
		}

		when (inferredLoader) {
			is Loader.Fabric -> {
				extension.jarTask.convention(providers.provider {
					extensions.getByType<dev.kikugie.loomx.LoomCompatProjectExtension>().modJar.name
				})
				extension.sourcesJarTask.convention(providers.provider {
					extensions.getByType<dev.kikugie.loomx.LoomCompatProjectExtension>().modSourcesJar.name
				})
			}
			else -> {
				extension.jarTask.convention("jar")
				extension.sourcesJarTask.convention("sourcesJar")
			}
		}

		listOf("org.jetbrains.kotlin.jvm", "com.google.devtools.ksp", "dev.kikugie.fletching-table").forEach {
			apply(
				plugin = it
			)
		}

		afterEvaluate {
			val ctx = Context(
				project = this,
				extension = extension,
				loader = Loader.of(extension.loader.get()),
				stonecutter = project.sc
			)
			configureProject(ctx)
		}
	}

	private fun Project.configureProject(ctx: Context) {
		listOf("java", "me.modmuss50.mod-publish-plugin", "idea", "org.jsonschema2pojo").forEach { apply(plugin = it) }

		version = ctx.fullVersion
		ctx.extension.requiredJava.set(ctx.javaVersion)

		if (ctx.loader.isFabricLike) {
			ctx.extension.dependencies {
				required("java") { fabricLikeVersionRange = ">=${ctx.javaVersion.majorVersion}" }
			}
		}

		configureFletchingTable(ctx)
		configureJsonSchema2Pojo(ctx)
		configureTesting()
		registerGenerateManifestTask(ctx)
		configureJarTask(ctx)
		configureIdea()
		configureProcessResources(ctx)
		configureJava(ctx)
		registerBuildAndCollectTask(ctx)

		configureModPublishing(ctx)

		if (envTrue("PUB_MAVEN_ENABLE")) {
			configureMavenPublishing(ctx)
		}
	}

	private fun Project.configureJava(ctx: Context) {
		extensions.configure<JavaPluginExtension>("java") {
			withSourcesJar()
			withJavadocJar()
			sourceCompatibility = ctx.javaVersion
			targetCompatibility = ctx.javaVersion
		}
	}

	private fun Project.registerGenerateManifestTask(ctx: Context) {
		val manifestOutputDir = layout.buildDirectory.dir("generated/modManifest")
		val generateTask = tasks.register<GenerateModManifestTask>("generateModManifest") {
			content.set(ctx.loader.generateManifest(ctx))
			outputFile.set(layout.buildDirectory.file("generated/modManifest/${ctx.loader.modManifestPath}"))
		}

		the<JavaPluginExtension>().sourceSets.named("main") { resources.srcDir(manifestOutputDir) }
		tasks.named<ProcessResources>("processResources") { dependsOn(generateTask) }
	}

	private fun Project.configureProcessResources(ctx: Context) {
		tasks.named<ProcessResources>("processResources") {
			dependsOn(tasks.named("stonecutterGenerate"), "kspKotlin")
			filesMatching("*.mixins.json") {
				expand("java" to "JAVA_${ctx.javaVersion.majorVersion}")
			}
			exclude(ctx.loader.excludedResources)
		}
	}

	private fun Project.configureJarTask(ctx: Context) {
		val generateTask = tasks.named("generateModManifest")
		tasks.withType<Jar>().configureEach {
			archiveBaseName.set(ctx.modId)
			dependsOn(generateTask)
		}
	}

	private fun Project.configureIdea() {
		extensions.configure<IdeaModel>("idea") {
			module {
				isDownloadJavadoc = true
				isDownloadSources = true
			}
		}
	}

	private fun Project.configureFletchingTable(ctx: Context) {
		extensions.configure<FletchingTableExtension> {
			mixins.create("main") { mixin("default", "${ctx.modId}.mixins.json") }
			j52j.register("main") { extension("json", "**/*.json5") }
		}
	}

	// The jsonSchema2Pojo{} extension's properties are plain Java bean setters,
	// not real Kotlin vars/Provider-backed -- Kotlin property-assignment syntax
	// silently does nothing here, must call the setters explicitly.
	private fun Project.configureJsonSchema2Pojo(ctx: Context) {
		extensions.configure<org.jsonschema2pojo.gradle.JsonSchemaExtension> {
			setSource(files(rootProject.file("../../packages/protocol/generated/jsonschema")))
			setTargetPackage("com.smartmc.protocol")
			setAnnotationStyle("gson")
		}
		// The plugin only wires its output into compileJava's inputs, not as a
		// proper Provider-tracked source directory -- Gradle's stricter
		// task-dependency validation (9.x) then flags every OTHER consumer of
		// that same generated-sources directory (compileKotlin, sourcesJar,
		// javadoc, ...) one at a time as build failures. Fix it for the whole
		// class of consumer task TYPES at once via mustRunAfter (ordering
		// only, not a hard dependency). Deliberately scoped to these three
		// types, not a blanket tasks.configureEach{} over everything -- that
		// was tried first and caused a real circular dependency by also
		// touching tasks generateJsonSchema2Pojo's own upstream chain
		// (stonecutterGenerate, kspKotlin, generateModManifest, ...) runs
		// through, which already have their own carefully ordered edges.
		val generate = tasks.named("generateJsonSchema2Pojo")
		// Kotlin's own compile task doesn't extend Gradle's built-in
		// AbstractCompile, so it needs naming explicitly rather than by type.
		tasks.named("compileKotlin") { dependsOn(generate) }
		tasks.withType<org.gradle.api.tasks.compile.AbstractCompile>().configureEach { mustRunAfter(generate) }
		tasks.withType<Jar>().configureEach { mustRunAfter(generate) }
		tasks.withType<org.gradle.api.tasks.javadoc.Javadoc>().configureEach { mustRunAfter(generate) }
	}

	// Applied uniformly to both loaders (unlike H2/java-noise, which are wired
	// per-loader in build.<loader>.gradle.kts since they need include()/jarJar()
	// embedding) -- test dependencies never ship in the mod jar, so there's
	// nothing loader-specific here, just the JUnit 5 platform every versioned
	// subproject's already-scaffolded (but previously empty) test source set needs.
	private fun Project.configureTesting() {
		dependencies {
			"testImplementation"(platform("org.junit:junit-bom:5.11.4"))
			"testImplementation"("org.junit.jupiter:junit-jupiter")
			// Gradle's test worker talks to JUnit via the Launcher API, which
			// junit-jupiter no longer pulls in transitively -- must be added
			// explicitly or the test task fails before running anything.
			"testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
			// Loom wires Minecraft's bundled Netty into Fabric's test
			// classpath automatically, but NeoForge's ModDevGradle plugin
			// only wires it into `main`, not `test` -- declared explicitly
			// here so Netty-pipeline tests compile identically on both
			// loaders. Version is unrelated to whatever Minecraft bundles;
			// these tests run in a plain JVM, never the actual game.
			"testImplementation"("io.netty:netty-buffer:4.1.115.Final")
			"testImplementation"("io.netty:netty-transport:4.1.115.Final")
			"testImplementation"("io.netty:netty-codec:4.1.115.Final")
			// Same NeoForge-vs-Fabric asymmetry as above -- touching SmartMC's
			// LOGGER field (e.g. from NoiseHandshakeHandler) triggers its
			// static initializer, which needs SLF4J on the classpath.
			"testImplementation"("org.slf4j:slf4j-api:2.0.16")
		}
		tasks.withType<Test>().configureEach {
			useJUnitPlatform()
		}
	}

	private fun Project.registerBuildAndCollectTask(ctx: Context) {
		tasks.register<Copy>("buildAndCollect") {
			from(
				tasks.named(ctx.extension.jarTask.get()),
				tasks.named(ctx.extension.sourcesJarTask.get()),
				tasks.named("javadocJar")
			)
			into(rootProject.layout.buildDirectory.file("libs/${ctx.basicVersion}"))
			dependsOn("build")
			group = "build"
		}
	}
}
