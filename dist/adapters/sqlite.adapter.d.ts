import { TimeAction } from './../actions';
import { ContractPayload } from './../types/hive-stream';
import { AdapterBase } from './base.adapter';
import { Database } from 'sqlite3';
export declare class SqliteAdapter extends AdapterBase {
    private db;
    private blockNumber;
    private lastBlockNumber;
    private blockId;
    private prevBlockId;
    private transactionId;
    getDb(): Database;
    protected create(): Promise<boolean>;
    protected loadActions(): Promise<TimeAction[]>;
    protected loadState(): Promise<any>;
    protected saveState(data: any): Promise<boolean>;
    protected processOperation(op: any, blockNumber: number, blockId: string, prevBlockId: string, trxId: string, blockTime: Date): Promise<void>;
    protected processTransfer(operation: any, payload: ContractPayload, metadata: {
        sender: string;
        amount: string;
    }): Promise<boolean>;
    protected processCustomJson(operation: any, payload: ContractPayload, metadata: {
        sender: string;
        isSignedWithActiveKey: boolean;
    }): Promise<boolean>;
    protected addEvent(date: string, contract: string, action: string, payload: ContractPayload, data: unknown): Promise<boolean>;
    getTransfers(): Promise<unknown>;
    getEvents(): Promise<unknown>;
    getTransfersByContract(contract: string): Promise<unknown>;
    getTransfersByAccount(account: string): Promise<unknown>;
    getTransfersByBlockid(blockId: any): Promise<unknown>;
    getJson(): Promise<unknown>;
    getJsonByContract(contract: string): Promise<unknown>;
    getJsonByAccount(account: string): Promise<unknown>;
    getJsonByBlockid(blockId: any): Promise<unknown>;
    protected destroy(): Promise<boolean>;
}
