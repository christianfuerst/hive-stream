export declare class Exchange {
    exchangeId: any;
    private oneHour;
    rateUsdHive: any;
    rateUsdHbd: any;
    private lastFetch;
    updateRates(): Promise<any>;
    fetchRates(): Promise<any>;
}
