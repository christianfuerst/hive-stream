import { TimeAction } from './../actions';
import { ContractPayload } from './../types/hive-stream';
import { AdapterBase } from './base.adapter';
import { Db } from 'mongodb';
export declare class MongodbAdapter extends AdapterBase {
    private client;
    private db;
    private mongo;
    private blockNumber;
    private lastBlockNumber;
    private blockId;
    private prevBlockId;
    private transactionId;
    constructor(uri: string, database: string, options?: {
        useNewUrlParser: boolean;
        useUnifiedTopology: boolean;
    });
    protected getDbInstance(): Promise<Db>;
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
    protected destroy(): Promise<boolean>;
}
