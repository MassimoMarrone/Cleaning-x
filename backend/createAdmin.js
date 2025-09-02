import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

import fetch from 'node-fetch';

const createAdmin = async () => {
  try {
    const adminData = {
      name: 'Amministratore',
      email: 'admin@cleaningx.com',
      password: 'admin123',
      secretKey: process.env.ADMIN_SECRET_KEY || 'cleaning-x-admin-2025'
    };

    const response = await fetch('http://localhost:8080/api/auth/create-first-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin creato con successo!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo accesso!');
    } else {
      console.log('❌ Errore:', result.error);
      if (result.error.includes('Admin già esistenti')) {
        console.log('ℹ️  Usa la dashboard admin per gestire gli utenti.');
      }
    }
  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);
    console.log('🔧 Assicurati che il server backend sia avviato.');
  }
};

createAdmin();
