
// Configuration file for Mercury Core. Hover over a property to see its description!
// If you're running in production, you'll need to rebuild Mercury Core to apply changes.

export default {
	Name: "Neptune",
	Domain: "betterblox.win",
	DatabaseURL: "http://localhost:8000",
	RCCServiceProxyURL: "http://localhost:64990",
	LauncherURI: "mercury-player:",
	CurrencySymbol: "又",
	Pages: ["Statistics", "Forum"],

	// 'noob' colours
	DefaultBodyColors: {
		Head: 24,
		LeftArm: 24,
		LeftLeg: 119,
		RightArm: 24,
		RightLeg: 119,
		Torso: 23,
	},

	Logging: {
		Requests: true,
		FormattedErrors: false,
		Time: true,
	},

	Branding: {
		Favicon: "Branding/Favicon.svg",
		Icon: "Branding/Icon.svg",
		Tagline: "Dive into the fun, surface with friends",
		Descriptions: {
			"Endless possibilites":
				"Create or play your favourite games and customise your character with items on our catalog.",
			"Same nostalgia":
				"All of our clients will remain as vanilla as possible, to make sure it's exactly as you remember it..",
			"Everything is connected":
				"Connect with your friends via forums, games, And sharing your thoughts via the status feature.",
		},
	},

	Images: {
		DefaultPlaceIcons: ["Images/DefaultIcon1.avif"],
		DefaultPlaceThumbnails: [
			"Images/DefaultThumbnail1.avif",
			"Images/DefaultThumbnail2.avif",
			"Images/DefaultThumbnail3.avif",
		],
	},

	Themes: [
		{
			Name: "Standard",
			Path: "Themes/Standard.css",
                        },
                  {
                  Name: "Blue",
			Path: "Themes/Standard.css",        
		},
	],

	Filtering: {
		FilteredWords: [],
		ReplaceWith: "#",
		ReplaceType: "Character",
	},

	RegistrationKeys: {
		Enabled: true,
		Prefix: "neptunekey-",
	},
} satisfies import("./Assets/schema.ts").Config
