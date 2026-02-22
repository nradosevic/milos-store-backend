"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
});
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map