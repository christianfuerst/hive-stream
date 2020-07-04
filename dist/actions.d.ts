export declare class TimeAction {
    timeValue: string;
    id: string;
    contractName: string;
    contractMethod: string;
    payload: any;
    date: Date;
    constructor(timeValue: string, id: string, contractName: string, contractMethod: string, payload?: any, date?: Date);
    reset(): void;
}
