"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const categories_service_1 = require("../categories/categories.service");
const testimonials_service_1 = require("../testimonials/testimonials.service");
const faq_service_1 = require("../faq/faq.service");
const settings_service_1 = require("../settings/settings.service");
let SeedService = SeedService_1 = class SeedService {
    constructor(authService, categoriesService, testimonialsService, faqService, settingsService) {
        this.authService = authService;
        this.categoriesService = categoriesService;
        this.testimonialsService = testimonialsService;
        this.faqService = faqService;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async seed() {
        this.logger.log('Starting database seed...');
        await this.seedAdmin();
        await this.seedCategories();
        await this.seedTestimonials();
        await this.seedFaq();
        await this.seedSettings();
        this.logger.log('Database seed complete.');
    }
    async seedAdmin() {
        const email = 'admin@rariteti.rs';
        const existing = await this.authService.findAdminByEmail(email);
        if (!existing) {
            await this.authService.createAdmin(email, 'admin123');
            this.logger.log(`Admin created: ${email}`);
        }
        else {
            this.logger.log('Admin already exists, skipping.');
        }
    }
    async seedCategories() {
        const categories = await this.categoriesService.findAll();
        if (categories.length > 0) {
            this.logger.log('Categories already seeded, skipping.');
            return;
        }
        const tree = [
            {
                name: 'Slike i umetnost',
                slug: 'slike-i-umetnost',
                iconName: 'image',
                children: [
                    { name: 'Ulja na platnu', slug: 'ulja-na-platnu' },
                    { name: 'Akvareli', slug: 'akvareli' },
                    { name: 'Grafike', slug: 'grafike' },
                    { name: 'Skulpture', slug: 'skulpture' },
                ],
            },
            {
                name: 'Knjige i rukopisi',
                slug: 'knjige-i-rukopisi',
                iconName: 'book',
                children: [
                    { name: 'Stare knjige', slug: 'stare-knjige' },
                    { name: 'Razglednice', slug: 'razglednice' },
                    { name: 'Mape i atlasi', slug: 'mape-i-atlasi' },
                    { name: 'Rukopisi', slug: 'rukopisi' },
                ],
            },
            {
                name: 'Nameštaj',
                slug: 'namestaj',
                iconName: 'armchair',
                children: [
                    { name: 'Stolice i fotelje', slug: 'stolice-i-fotelje' },
                    { name: 'Stolovi', slug: 'stolovi' },
                    { name: 'Ormari i komode', slug: 'ormari-i-komode' },
                ],
            },
            {
                name: 'Sat i nakit',
                slug: 'sat-i-nakit',
                iconName: 'clock',
                children: [
                    { name: 'Džepni satovi', slug: 'dzepni-satovi' },
                    { name: 'Zidni satovi', slug: 'zidni-satovi' },
                    { name: 'Nakit', slug: 'nakit' },
                ],
            },
            {
                name: 'Porcelan i keramika',
                slug: 'porcelan-i-keramika',
                iconName: 'vase',
                children: [
                    { name: 'Servisi za čaj', slug: 'servisi-za-caj' },
                    { name: 'Vaze', slug: 'vaze' },
                    { name: 'Figurice', slug: 'figurice' },
                ],
            },
            {
                name: 'Numizmatika i filatelija',
                slug: 'numizmatika-i-filatelija',
                iconName: 'coins',
                children: [
                    { name: 'Novčići', slug: 'novici' },
                    { name: 'Novčanice', slug: 'novcanice' },
                    { name: 'Poštanske marke', slug: 'postanske-marke' },
                ],
            },
            {
                name: 'Vojni predmeti',
                slug: 'vojni-predmeti',
                iconName: 'shield',
                children: [
                    { name: 'Odlikovanja i medalje', slug: 'odlikovanja-i-medalje' },
                    { name: 'Uniforme', slug: 'uniforme' },
                    { name: 'Oružje i oprema', slug: 'oruzje-i-oprema' },
                ],
            },
            {
                name: 'Ostalo',
                slug: 'ostalo',
                iconName: 'archive',
            },
        ];
        await this.categoriesService.bulkImport(tree, 'merge');
        this.logger.log('Categories seeded.');
    }
    async seedTestimonials() {
        const existing = await this.testimonialsService.findAll();
        if (existing.length > 0) {
            this.logger.log('Testimonials already seeded, skipping.');
            return;
        }
        const testimonials = [
            {
                text: 'Pronašao sam upravo ono što sam tražio - autentičnu sliku iz perioda između dva svetska rata. Prodavac je bio izuzetno stručan i ljubazan.',
                authorName: 'Marko P.',
                source: 'Google recenzija',
            },
            {
                text: 'Odlična kolekcija antikviteta. Sve je uredno opisano i fotografisano. Preporučujem svima koji traže nešto posebno.',
                authorName: 'Jelena S.',
                source: 'Facebook',
            },
            {
                text: 'Kupio sam stari džepni sat koji je bio u porodici - pronašli su mi identičan model. Neverovatna usluga!',
                authorName: 'Dragan M.',
                source: 'Direktna poruka',
            },
        ];
        for (let i = 0; i < testimonials.length; i++) {
            await this.testimonialsService.create({ ...testimonials[i], sortOrder: i });
        }
        this.logger.log('Testimonials seeded.');
    }
    async seedFaq() {
        const existing = await this.faqService.findAll();
        if (existing.length > 0) {
            this.logger.log('FAQ already seeded, skipping.');
            return;
        }
        const faqs = [
            {
                question: 'Kako mogu da kupim predmet?',
                answer: 'Kontaktirajte nas putem obrasca na stranici predmeta ili pozovite nas direktno. Dogovorićemo sve detalje oko plaćanja i dostave.',
                sortOrder: 0,
            },
            {
                question: 'Da li dostavljate van Srbije?',
                answer: 'Da, dostavljamo u sve zemlje. Cena dostave zavisi od težine, dimenzija i destinacije. Kontaktirajte nas za preciznu cenu.',
                sortOrder: 1,
            },
            {
                question: 'Kako garantujete autentičnost predmeta?',
                answer: 'Svaki predmet prolazi kroz pažljivu proveru autentičnosti. Za vrednije predmete dostavljamo i sertifikate autentičnosti.',
                sortOrder: 2,
            },
            {
                question: 'Da li je moguće platiti na rate?',
                answer: 'Za vrednije predmete moguće je dogovoriti plaćanje u ratama. Kontaktirajte nas za više informacija.',
                sortOrder: 3,
            },
            {
                question: 'Šta ako nisam zadovoljan kupovinom?',
                answer: 'Vaše zadovoljstvo nam je prioritet. Ako imate bilo kakvih problema, kontaktirajte nas i pronađemo rešenje zajedno.',
                sortOrder: 4,
            },
        ];
        for (const faq of faqs) {
            await this.faqService.create(faq);
        }
        this.logger.log('FAQ seeded.');
    }
    async seedSettings() {
        const defaultSettings = [
            { key: 'site_name', value: 'Rariteti.rs', type: 'text' },
            { key: 'site_tagline', value: 'Vintage i antikviteti iz Srbije', type: 'text' },
            { key: 'contact_email', value: 'info@rariteti.rs', type: 'email' },
            { key: 'contact_phone', value: '+381 60 123 4567', type: 'text' },
            { key: 'contact_address', value: 'Beograd, Srbija', type: 'text' },
            { key: 'facebook_url', value: '', type: 'url' },
            { key: 'instagram_url', value: '', type: 'url' },
            { key: 'about_text', value: 'Rariteti.rs je specijalizovana prodavnica vintage i antiknih predmeta iz Srbije i regiona.', type: 'textarea' },
            { key: 'hero_title', value: 'Otkrijte jedinstvene vintage predmete', type: 'text' },
            { key: 'hero_subtitle', value: 'Autentični antikviteti sa pričom', type: 'text' },
        ];
        for (const s of defaultSettings) {
            try {
                await this.settingsService.findByKey(s.key);
            }
            catch {
                await this.settingsService.upsert(s.key, s.value, s.type);
            }
        }
        this.logger.log('Settings seeded.');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        categories_service_1.CategoriesService,
        testimonials_service_1.TestimonialsService,
        faq_service_1.FaqService,
        settings_service_1.SettingsService])
], SeedService);
//# sourceMappingURL=seed.service.js.map