"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./auth/auth.module");
const categories_module_1 = require("./categories/categories.module");
const tags_module_1 = require("./tags/tags.module");
const products_module_1 = require("./products/products.module");
const upload_module_1 = require("./upload/upload.module");
const testimonials_module_1 = require("./testimonials/testimonials.module");
const faq_module_1 = require("./faq/faq.module");
const contact_module_1 = require("./contact/contact.module");
const settings_module_1 = require("./settings/settings.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const sitemap_module_1 = require("./sitemap/sitemap.module");
const seed_module_1 = require("./seed/seed.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: database_config_1.getDatabaseConfig,
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            auth_module_1.AuthModule,
            categories_module_1.CategoriesModule,
            tags_module_1.TagsModule,
            products_module_1.ProductsModule,
            upload_module_1.UploadModule,
            testimonials_module_1.TestimonialsModule,
            faq_module_1.FaqModule,
            contact_module_1.ContactModule,
            settings_module_1.SettingsModule,
            dashboard_module_1.DashboardModule,
            sitemap_module_1.SitemapModule,
            seed_module_1.SeedModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map