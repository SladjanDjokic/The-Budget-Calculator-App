export {};

declare global {
	namespace NodeJS {
		interface Global {
			document: Document;
			window: Window;
			navigator: Navigator;
			appRoot: string;
			ENV(): string;
		}
	}
}
