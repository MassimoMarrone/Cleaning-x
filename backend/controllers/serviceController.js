import Service from '../models/Service.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import NotificationService from '../utils/notificationService.js';

// Ottieni tutti i servizi attivi
export const getServices = async (req, res) => {
  try {
    const { category, area, search } = req.query;
    
    let query = { isActive: true };
    
    // Filtra per categoria
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filtra per area
    if (area) {
      query.serviceAreas = { $regex: area, $options: 'i' };
    }
    
    // Ricerca testuale
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const services = await Service.find(query)
      .populate('provider', 'name businessName description profileImage rating reviewCount isVerified serviceAreas')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottieni un singolo servizio
export const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name businessName description profileImage rating reviewCount isVerified phone email serviceAreas');
    
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crea un nuovo servizio (solo per provider)
export const createService = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // Verifica che l'utente sia un provider
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: 'Solo i fornitori possono creare servizi' });
    }
    
    const serviceData = {
      ...req.body,
      provider: decoded.userId
    };
    
    const service = new Service(serviceData);
    await service.save();
    
    await service.populate('provider', 'name businessName');
    
    // 🔔 NOTIFICA: Servizio approvato automaticamente (o in attesa di approvazione)
    if (service.isActive) {
      await NotificationService.createServiceApprovedNotification(
        decoded.userId,
        service.title
      );
    }
    
    res.status(201).json({ message: 'Servizio creato con successo', service });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Aggiorna un servizio
export const updateService = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    // Solo il proprietario può modificare
    if (service.provider.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    Object.assign(service, req.body);
    await service.save();
    
    res.json({ message: 'Servizio aggiornato con successo', service });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Elimina un servizio
export const deleteService = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    // Solo il proprietario può eliminare
    if (service.provider.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    // Soft delete: marca come non attivo
    service.isActive = false;
    await service.save();
    
    res.json({ message: 'Servizio eliminato con successo' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ottieni servizi di un provider specifico
export const getProviderServices = async (req, res) => {
  try {
    const services = await Service.find({ 
      provider: req.params.providerId,
      isActive: true 
    }).populate('provider', 'name businessName rating reviewCount isVerified');
    
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
