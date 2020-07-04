"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = {
    ACTIVE_KEY: process.env.ACTIVE_KEY,
    POSTING_KEY: process.env.POSTING_KEY,
    JSON_ID: 'hivestream',
    HIVE_ENGINE_API: 'https://api.hive-engine.com/rpc',
    HIVE_ENGINE_ID: 'ssc-mainnet-hive',
    APP_NAME: 'steem-stream',
    PAYLOAD_IDENTIFIER: 'hivePayload',
    USERNAME: '',
    LAST_BLOCK_NUMBER: 0,
    BLOCK_CHECK_INTERVAL: 1000,
    BLOCKS_BEHIND_WARNING: 25,
    API_NODES: ['https://anyx.io', 'https://api.hive.blog'],
    DEBUG_MODE: false,
};
//# sourceMappingURL=config.js.map