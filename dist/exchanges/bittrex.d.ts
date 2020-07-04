import { Exchange } from './exchange';
export declare class BittrexExchange extends Exchange {
    exchangeId: string;
    fetchRates(): Promise<boolean>;
    private fetchRate;
}
