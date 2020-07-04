import { TimeAction } from './../actions';
import { ContractPayload } from './../types/hive-stream';
import { SignedBlock } from '@hiveio/dhive';
export declare class AdapterBase {
    constructor();
    protected create(): Promise<boolean>;
    protected destroy(): Promise<boolean>;
    protected loadActions(): Promise<TimeAction[]>;
    protected loadState(): Promise<any>;
    protected saveState(data: any): Promise<boolean | any>;
    protected processBlock(block: SignedBlock): Promise<any>;
    protected processOperation(op: any, blockNumber: number, blockId: string, prevBlockId: string, trxId: string, blockTime: Date): Promise<any>;
    protected processTransfer(operation: any, payload: ContractPayload, metadata: {
        sender: string;
        amount: string;
    }): Promise<boolean>;
    protected processCustomJson(operation: any, payload: ContractPayload, metadata: {
        sender: string;
        isSignedWithActiveKey: boolean;
    }): Promise<boolean>;
}
