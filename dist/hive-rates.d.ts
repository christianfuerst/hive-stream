export declare class HiveRates {
    private fiatRates;
    private hiveRates;
    private lastFetch;
    private oneHour;
    fetchRates(): Promise<boolean>;
    fiatToHiveRate(fiatSymbol: any, hiveSymbol: any): any;
    private getFiatRates;
}
