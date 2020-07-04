export declare class CoinflipContract {
    private _instance;
    private adapter;
    private blockNumber;
    private blockId;
    private previousBlockId;
    private transactionId;
    private create;
    private updateBlockInfo;
    flip(payload: any, { sender, amount }: {
        sender: any;
        amount: any;
    }): Promise<void>;
}
