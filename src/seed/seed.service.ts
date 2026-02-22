import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CategoriesService } from '../categories/categories.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { FaqService } from '../faq/faq.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private authService: AuthService,
    private categoriesService: CategoriesService,
    private testimonialsService: TestimonialsService,
    private faqService: FaqService,
    private settingsService: SettingsService,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting database seed...');
    await this.seedAdmin();
    await this.seedCategories();
    await this.seedTestimonials();
    await this.seedFaq();
    await this.seedSettings();
    this.logger.log('Database seed complete.');
  }

  private async seedAdmin(): Promise<void> {
    const email = 'admin@rariteti.rs';
    const existing = await this.authService.findAdminByEmail(email);
    if (!existing) {
      await this.authService.createAdmin(email, 'admin123');
      this.logger.log(`Admin created: ${email}`);
    } else {
      this.logger.log('Admin already exists, skipping.');
    }
  }

  private async seedCategories(): Promise<void> {
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

  private async seedTestimonials(): Promise<void> {
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

  private async seedFaq(): Promise<void> {
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

  private async seedSettings(): Promise<void> {
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
      } catch {
        await this.settingsService.upsert(s.key, s.value, s.type);
      }
    }
    this.logger.log('Settings seeded.');
  }
}
