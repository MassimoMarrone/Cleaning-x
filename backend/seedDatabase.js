import mongoose from 'mongoose';
import User from './models/User.js';
import Service from './models/Service.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedDatabase() {
  try {
    console.log('🌱 Inizializzo il database...');

    // Pulisce il database esistente
    await User.deleteMany({ role: 'provider' });
    await Service.deleteMany({});

    console.log('📱 Creo fornitori di servizi...');

    // Crea fornitori di servizi
    const providers = [
      {
        name: 'Marco Rossi',
        email: 'marco.rossi@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'provider',
        businessName: 'Pulizie Express Roma',
        description: 'Servizi di pulizia professionali con oltre 10 anni di esperienza. Utilizzo solo prodotti ecologici e attrezzature moderne.',
        phone: '+39 333 123 4567',
        serviceAreas: ['Roma Centro', 'Trastevere', 'Testaccio', 'Prati'],
        rating: 4.8,
        reviewCount: 127,
        isVerified: true
      },
      {
        name: 'Lucia Bianchi',
        email: 'lucia.bianchi@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'provider',
        businessName: 'Clean & Shine Milano',
        description: 'Specializzata in pulizie post-ristrutturazione e uffici. Team professionale e attrezzature all\'avanguardia.',
        phone: '+39 340 987 6543',
        serviceAreas: ['Milano Centro', 'Porta Garibaldi', 'Brera', 'Navigli'],
        rating: 4.9,
        reviewCount: 203,
        isVerified: true
      },
      {
        name: 'Giuseppe Verde',
        email: 'giuseppe.verde@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'provider',
        businessName: 'Eco Pulizie Napoli',
        description: 'Servizi di pulizia ecosostenibili per case e uffici. Prodotti bio e rispetto per l\'ambiente.',
        phone: '+39 351 456 7890',
        serviceAreas: ['Napoli Centro', 'Vomero', 'Chiaia', 'Posillipo'],
        rating: 4.7,
        reviewCount: 89,
        isVerified: true
      },
      {
        name: 'Anna Neri',
        email: 'anna.neri@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'provider',
        businessName: 'Pulizie Professionali Torino',
        description: 'Specialista in pulizie profonde e sanificazione. Servizio rapido e prezzi competitivi.',
        phone: '+39 347 234 5678',
        serviceAreas: ['Torino Centro', 'San Salvario', 'Crocetta', 'Borgo Po'],
        rating: 4.6,
        reviewCount: 156,
        isVerified: true
      }
    ];

    const createdProviders = await User.insertMany(providers);
    console.log(`✅ Creati ${createdProviders.length} fornitori`);

    console.log('🛠️ Creo servizi...');

    // Crea servizi per ogni fornitore
    const services = [];

    // Servizi per Marco Rossi (Roma)
    services.push(
      {
        provider: createdProviders[0]._id,
        title: 'Pulizia Casa Completa',
        category: 'house-cleaning',
        description: 'Pulizia completa di tutti gli ambienti della casa con prodotti professionali ecologici.',
        basePrice: 65,
        priceType: 'fixed',
        duration: 180, // 3 ore
        serviceAreas: ['Roma Centro', 'Trastevere', 'Testaccio', 'Prati'],
        includedServices: ['Aspirapolvere', 'Lavaggio pavimenti', 'Pulizia bagni', 'Cucina', 'Spolveratura mobili'],
        additionalServices: [
          { name: 'Pulizia frigorifero', price: 15 },
          { name: 'Pulizia forno', price: 20 },
          { name: 'Stiratura (10 capi)', price: 25 }
        ],
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop'],
        rating: 4.8,
        reviewCount: 45
      },
      {
        provider: createdProviders[0]._id,
        title: 'Pulizia Ufficio Standard',
        category: 'office-cleaning',
        description: 'Servizio di pulizia per uffici con particolare attenzione alle postazioni di lavoro.',
        basePrice: 80,
        priceType: 'fixed',
        duration: 120, // 2 ore
        serviceAreas: ['Roma Centro', 'EUR', 'Prati'],
        includedServices: ['Pulizia scrivanie', 'Aspirapolvere', 'Svuotamento cestini', 'Pulizia bagni', 'Sanificazione superfici'],
        additionalServices: [
          { name: 'Pulizia vetri interni', price: 30 },
          { name: 'Pulizia sala riunioni', price: 25 }
        ],
        images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop'],
        rating: 4.7,
        reviewCount: 32
      }
    );

    // Servizi per Lucia Bianchi (Milano)
    services.push(
      {
        provider: createdProviders[1]._id,
        title: 'Pulizia Post-Ristrutturazione',
        category: 'post-construction',
        description: 'Rimozione completa di polvere, detriti e residui di lavori edili con attrezzature specializzate.',
        basePrice: 120,
        priceType: 'fixed',
        duration: 360, // 6 ore
        serviceAreas: ['Milano Centro', 'Porta Garibaldi', 'Brera'],
        includedServices: ['Rimozione polvere fine', 'Pulizia profonda pavimenti', 'Lavaggio vetri', 'Sanificazione ambienti'],
        additionalServices: [
          { name: 'Pulizia terrazzi/balconi', price: 40 },
          { name: 'Lucidatura parquet', price: 60 }
        ],
        images: ['https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&h=250&fit=crop'],
        rating: 4.9,
        reviewCount: 78
      },
      {
        provider: createdProviders[1]._id,
        title: 'Pulizia Profonda Casa',
        category: 'deep-cleaning',
        description: 'Pulizia approfondita per case che necessitano di un intervento straordinario.',
        basePrice: 95,
        priceType: 'fixed',
        duration: 300, // 5 ore
        serviceAreas: ['Milano Centro', 'Navigli', 'Brera', 'Porta Garibaldi'],
        includedServices: ['Pulizia elettrodomestici', 'Lavaggio tende', 'Pulizia armadi interni', 'Disinfettazione completa'],
        additionalServices: [
          { name: 'Pulizia cappa aspirante', price: 25 },
          { name: 'Lavaggio tappezzeria', price: 50 }
        ],
        images: ['https://images.unsplash.com/photo-1527515862127-a4fc54e6782d?w=400&h=250&fit=crop'],
        rating: 4.8,
        reviewCount: 63
      }
    );

    // Servizi per Giuseppe Verde (Napoli)
    services.push(
      {
        provider: createdProviders[2]._id,
        title: 'Pulizia Ecologica Casa',
        category: 'house-cleaning',
        description: 'Pulizia completa utilizzando esclusivamente prodotti biologici e biodegradabili.',
        basePrice: 70,
        priceType: 'fixed',
        duration: 200, // 3h 20min
        serviceAreas: ['Napoli Centro', 'Vomero', 'Chiaia'],
        includedServices: ['Prodotti 100% bio', 'Pulizia completa ambienti', 'Sanificazione naturale'],
        additionalServices: [
          { name: 'Aromaterapia ambienti', price: 15 },
          { name: 'Pulizia cristalli/specchi', price: 20 }
        ],
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop'],
        rating: 4.7,
        reviewCount: 41
      },
      {
        provider: createdProviders[2]._id,
        title: 'Pulizia Vetri e Finestre Eco',
        category: 'windows',
        description: 'Servizio specializzato per vetri utilizzando solo detergenti ecologici.',
        basePrice: 35,
        priceType: 'fixed',
        duration: 90, // 1h 30min
        serviceAreas: ['Napoli Centro', 'Vomero', 'Chiaia', 'Posillipo'],
        includedServices: ['Vetri interni ed esterni', 'Pulizia cornici', 'Davanzali'],
        additionalServices: [
          { name: 'Pulizia persiane', price: 25 },
          { name: 'Trattamento anticalcare', price: 15 }
        ],
        images: ['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=250&fit=crop'],
        rating: 4.6,
        reviewCount: 28
      }
    );

    // Servizi per Anna Neri (Torino)
    services.push(
      {
        provider: createdProviders[3]._id,
        title: 'Pulizia Rapida Express',
        category: 'house-cleaning',
        description: 'Servizio di pulizia veloce ed efficiente per chi ha poco tempo.',
        basePrice: 55,
        priceType: 'fixed',
        duration: 120, // 2 ore
        serviceAreas: ['Torino Centro', 'San Salvario', 'Crocetta'],
        includedServices: ['Pulizia prioritaria bagni e cucina', 'Aspirapolvere generale', 'Riordino ambienti'],
        additionalServices: [
          { name: 'Cambio biancheria letto', price: 10 },
          { name: 'Lavaggio piatti', price: 15 }
        ],
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop'],
        rating: 4.5,
        reviewCount: 67
      },
      {
        provider: createdProviders[3]._id,
        title: 'Pulizia Tappeti e Moquette',
        category: 'carpets',
        description: 'Lavaggio professionale con macchinari a vapore e prodotti specifici.',
        basePrice: 45,
        priceType: 'fixed',
        duration: 150, // 2h 30min
        serviceAreas: ['Torino Centro', 'San Salvario', 'Crocetta', 'Borgo Po'],
        includedServices: ['Aspirazione profonda', 'Lavaggio a vapore', 'Trattamento antimacchia'],
        additionalServices: [
          { name: 'Trattamento antiacaro', price: 20 },
          { name: 'Deodorizzazione', price: 15 }
        ],
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop'],
        rating: 4.8,
        reviewCount: 52
      }
    );

    const createdServices = await Service.insertMany(services);
    console.log(`✅ Creati ${createdServices.length} servizi`);

    console.log('🎉 Database inizializzato con successo!');
    console.log('\n📋 Fornitori creati:');
    createdProviders.forEach(provider => {
      console.log(`   • ${provider.businessName} (${provider.email})`);
    });

    console.log('\n🛠️ Servizi per categoria:');
    const categories = [...new Set(createdServices.map(s => s.category))];
    categories.forEach(category => {
      const count = createdServices.filter(s => s.category === category).length;
      console.log(`   • ${category}: ${count} servizi`);
    });

    console.log('\n🔐 Credenziali di accesso fornitori:');
    console.log('   Email: [fornitore]@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
