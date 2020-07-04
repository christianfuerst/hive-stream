import { TimeAction } from './actions';
import { ConfigInterface } from './config';
export declare class Streamer {
    private customJsonSubscriptions;
    private customJsonIdSubscriptions;
    private customJsonHiveEngineSubscriptions;
    private createClaimedAccountSubscriptions;
    private commentSubscriptions;
    private postSubscriptions;
    private transferSubscriptions;
    private attempts;
    private config;
    private client;
    private hive;
    private username;
    private postingKey;
    private activeKey;
    private blockNumberTimeout;
    private latestBlockTimer;
    private lastBlockNumber;
    private blockId;
    private previousBlockId;
    private transactionId;
    private blockTime;
    private latestBlockchainTime;
    private disableAllProcessing;
    private contracts;
    private adapter;
    private actions;
    private utils;
    constructor(userConfig?: Partial<ConfigInterface>);
    registerAdapter(adapter: any): void;
    getAdapter(): any;
    /**
     * Register a new action
     *
     */
    registerAction(action: TimeAction): Promise<void>;
    /**
     * Resets a specific action time value
     *
     * @param id
     *
     */
    resetAction(id: string): void;
    registerContract(name: string, contract: any): this;
    unregisterContract(name: string): void;
    /**
     * setConfig
     *
     * Allows specific configuration settings to be overridden
     *
     * @param config
     */
    setConfig(config: Partial<ConfigInterface>): this;
    /**
     * Start
     *
     * Starts the streamer bot to get blocks from the Hive API
     *
     */
    start(): Promise<Streamer>;
    /**
     * Stop
     *
     * Stops the streamer from running
     */
    stop(): Promise<void>;
    private getLatestBlock;
    private getBlock;
    private loadBlock;
    processOperation(op: any, blockNumber: number, blockId: string, prevBlockId: string, trxId: string, blockTime: Date): void;
    private processActions;
    saveStateToDisk(): Promise<void>;
    saveToHiveApi(from: string, data: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    getAccountTransfers(account: string, from?: number, limit?: number): Promise<any>;
    transferHiveTokens(from: string, to: string, amount: string, symbol: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    transferHiveTokensMultiple(from: string, accounts: string[], amount: string, symbol: string, memo?: string): Promise<boolean>;
    transferHiveEngineTokens(from: string, to: string, symbol: string, quantity: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    transferHiveEngineTokensMultiple(from: string, accounts: any[], symbol: string, memo?: string, amount?: string): Promise<void>;
    issueHiveEngineTokens(from: string, to: string, symbol: string, quantity: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    issueHiveEngineTokensMultiple(from: string, accounts: any[], symbol: string, memo?: string, amount?: string): Promise<void>;
    upvote(votePercentage: string, username: string, permlink: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    downvote(votePercentage: string, username: string, permlink: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    getTransaction(blockNumber: number, transactionId: string): Promise<import("@hiveio/dhive").SignedTransaction>;
    verifyTransfer(transaction: any, from: string, to: string, amount: string): Promise<boolean>;
    onComment(callback: any): void;
    onPost(callback: any): void;
    onTransfer(account: string, callback: () => void): void;
    onCustomJson(callback: any): void;
    onCustomJsonId(callback: any, id: string): void;
    onCreateClaimedAccount(callback: any): void;
    onHiveEngine(callback: any): void;
}
