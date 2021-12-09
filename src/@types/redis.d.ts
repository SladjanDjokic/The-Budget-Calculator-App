declare namespace Redis {
	export interface Availability {
		companyId: number;
		destinationId: number;
		accommodations: AvailabilityAccommodation[];
	}
	export interface AvailabilityAccommodation {
		id: number;
		name: string;
		code: string;
		status: string;
		maxOccupancy: number;
		maxSleeps: number;
		roomClass: string;
		adaCompliant: number;
		price: AvailabilityAccommodationPrice[];
	}
	export interface AvailabilityAccommodationPrice {
		total: number;
		currencyCode: string;
		qtyAvailable: number;
		rate: AvailabilityRate;
		maxPrice: boolean;
		minPrice: boolean;
		maxStay?: number;
		minStay?: number;
	}
	export interface AvailabilityRate extends Omit<Model.Rate, 'id' | 'destinationId'> {}

	export interface UpsellPackageAvailability {
		destinationId: number;
		upsellPackages: AvailableUpsellPackage[];
	}
	export interface AvailableUpsellPackage {
		id: number;
		title: string;
		externalTitle: string;
		externalId: string;
		pricingType: Model.UpsellPackagePricingType;
		quantity: number;
		priceDetail: UpsellPackagePriceDetail;
	}
	export interface UpsellPackagePriceDetail {
		amountBeforeTax: number;
		amountAfterTax: number;
		amountPoints: number;
	}
}
