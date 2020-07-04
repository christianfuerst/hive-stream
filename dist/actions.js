"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimeAction {
    constructor(timeValue, id, contractName, contractMethod, payload = {}, date = new Date()) {
        this.timeValue = timeValue;
        this.id = id;
        this.contractName = contractName;
        this.contractMethod = contractMethod;
        this.payload = payload;
        this.date = date;
    }
    reset() {
        this.date = new Date();
    }
}
exports.TimeAction = TimeAction;
//# sourceMappingURL=actions.js.map