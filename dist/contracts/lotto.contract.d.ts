export declare class LottoContract {
    private _instance;
    private adapter;
    private blockNumber;
    private blockId;
    private previousBlockId;
    private transactionId;
    private create;
    private destroy;
    private updateBlockInfo;
    private getBalance;
    private getPreviousUserTicketsForCurrentDrawType;
    buy(payload: any, { sender, amount }: {
        sender: any;
        amount: any;
    }): Promise<import("mongodb").ReplaceWriteOpResult | import("mongodb").InsertOneWriteOpResult<any>>;
    drawHourlyLottery(): Promise<any[]>;
    drawDailyLottery(): Promise<any[]>;
    getWinners(count: number, entries: any[]): Promise<any[]>;
}
