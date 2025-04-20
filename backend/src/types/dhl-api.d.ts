// src/types/dhl-api.d.ts
declare module "dhl-api" {
	export class API {
		constructor(config: { username: string; password: string });
		getTracking(trackingNumber: string): Promise<any>;
	}
}
