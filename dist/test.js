"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const coinflip_contract_1 = require("./contracts/coinflip.contract");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const streamer_1 = require("./streamer");
const dice_contract_1 = require("./contracts/dice.contract");
global.fetch = require('node-fetch');
const streamer = new streamer_1.Streamer({
    JSON_ID: 'hivestream',
    PAYLOAD_IDENTIFIER: 'hivePayload'
});
//streamer.registerAdapter(new SqliteAdapter());
//streamer.registerAdapter(new MongodbAdapter('mongodb://127.0.0.1:27017', 'hivestream'));
// Register contract
streamer.registerContract('hivedice', new dice_contract_1.DiceContract());
streamer.registerContract('hiveflip', new coinflip_contract_1.CoinflipContract());
// Start streaming
streamer.start();
// streamer.onPost((op: any) => {
//     console.log(op);
// });
//# sourceMappingURL=test.js.map