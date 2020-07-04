export declare class DiceContract {
    private _instance;
    private blockNumber;
    private blockId;
    private previousBlockId;
    private transactionId;
    private create;
    private destroy;
    private updateBlockInfo;
    /**
     * Get Balance
     *
     * Helper method for getting the contract account balance. In the case of our dice contract
     * we want to make sure the account has enough money to pay out any bets
     *
     * @returns number
     */
    private getBalance;
    /**
     * Roll
     *
     * Automatically called when a custom JSON action matches the following method
     *
     * @param payload
     * @param param1 - sender and amount
     */
    private roll;
    private testauto;
}
