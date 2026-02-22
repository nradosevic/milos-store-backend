"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const seed_service_1 = require("./seed/seed.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: '*', credentials: false });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.setGlobalPrefix('api', {
        exclude: ['sitemap.xml'],
    });
    const seedService = app.get(seed_service_1.SeedService);
    await seedService.seed();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map