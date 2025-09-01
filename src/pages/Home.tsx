import React from 'react';

const Home: React.FC = () => (
  <>
    <section className="hero">
      <div className="hero-content">
        <h1>Pulizie professionali per la tua casa e ufficio</h1>
        <p>Affidati a noi per un servizio di pulizia impeccabile e professionale.</p>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Cerca città, servizio..." />
        <button>Cerca</button>
      </div>
    </section>
    <section className="services" id="services">
      <h2>I nostri servizi</h2>
      <div className="cards">
        <div className="card">
          <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80" alt="Pulizia domestica" />
          <h3>Pulizia domestica</h3>
          <p>Servizio completo per la tua casa, con prodotti professionali.</p>
        </div>
        <div className="card">
          <img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80" alt="Pulizia uffici" />
          <h3>Pulizia uffici</h3>
          <p>Ambienti di lavoro puliti e igienizzati per la massima produttività.</p>
        </div>
        <div className="card">
          <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Pulizia post-ristrutturazione" />
          <h3>Pulizia post-ristrutturazione</h3>
          <p>Rimuoviamo polvere e residui dopo lavori edili, per un ambiente pronto da vivere.</p>
        </div>
      </div>
    </section>
    <section className="about" id="about">
      <h2>Chi siamo</h2>
      <p>Cleaning-x è la piattaforma che mette in contatto clienti e professionisti della pulizia. Affidabilità, trasparenza e qualità sono i nostri valori.</p>
    </section>
    <footer className="footer" id="contact">
      <p>&copy; 2025 Cleaning-x. Tutti i diritti riservati.</p>
    </footer>
  </>
);

export default Home;
