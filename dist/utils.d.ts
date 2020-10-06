import { Client, SignedTransaction } from '@hiveio/dhive';
import { ConfigInterface } from './config';
export declare const Utils: {
    sleep(milliseconds: number): Promise<unknown>;
    shuffle(array: any): any;
    roundPrecision(value: any, precision: any): number;
    randomRange(min?: number, max?: number): number;
    randomString(length?: number): string;
    convertHiveAmount(amount: any, fiatSymbol: any, hiveSymbol: any): Promise<any>;
    jsonParse(str: string): any;
    getTransaction(client: Client, blockNumber: number, transactionId: any): Promise<SignedTransaction>;
    verifyTransfer(transaction: SignedTransaction, from: string, to: string, amount: string): Promise<boolean>;
    transferHiveTokens(client: Client, config: Partial<ConfigInterface>, from: string, to: string, amount: string, symbol: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    transferHiveTokensMultiple(client: Client, config: ConfigInterface, from: string, accounts: string[], amount: string, symbol: string, memo: string): Promise<boolean>;
    getAccountTransfers(client: Client, account: string, from?: number, max?: number): Promise<any>;
    getApiJson(client: Client, from?: number, limit?: number): Promise<any>;
    transferHiveEngineTokens(client: Client, config: ConfigInterface, from: string, to: string, quantity: string, symbol: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    transferHiveEngineTokensMultiple(client: Client, config: ConfigInterface, from: string, accounts: any[], symbol: string, memo: string, amount?: string): Promise<void>;
    issueHiveEngineTokens(client: Client, config: ConfigInterface, from: string, to: string, symbol: string, quantity: string, memo?: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    issueHiveEngineTokensMultiple(client: Client, config: ConfigInterface, from: string, accounts: any[], symbol: string, memo: string, amount?: string): Promise<void>;
    randomNumber(previousBlockId: any, blockId: any, transactionId: any): number;
    upvote(client: Client, config: Partial<ConfigInterface>, voter: string, votePercentage: string, author: string, permlink: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    downvote(client: Client, config: Partial<ConfigInterface>, voter: string, votePercentage: string, author: string, permlink: string): Promise<import("@hiveio/dhive").TransactionConfirmation>;
    votingWeight(votePercentage: number): number;
    asyncForEach(array: any[], callback: any): Promise<void>;
    getTransferUrl(to: string, memo: string, amount: string, redirectUri: string): string;
};