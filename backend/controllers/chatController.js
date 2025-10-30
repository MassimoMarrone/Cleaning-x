import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Crea o recupera una conversazione tra due utenti (opz. vincolata a booking)
export async function createOrGetConversation(req, res) {
  try {
    const { otherUserId, bookingId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId richiesto' });

    const participants = [String(req.user.id), String(otherUserId)];

    const query = { participants: { $all: participants, $size: 2 } };
    if (bookingId) {
      query.booking = bookingId;
    }

    let convo = await Conversation.findOne(query);
    if (!convo) {
      convo = await Conversation.create({ participants, booking: bookingId || undefined });
    }
    res.json(convo);
  } catch (err) {
    console.error('createOrGetConversation error', err);
    res.status(500).json({ error: 'Errore creazione conversazione' });
  }
}

export async function listConversations(req, res) {
  try {
    const userId = String(req.user.id);
    const convos = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name email role')
      .populate('booking', '_id date time');
    // Calcola non letti per ogni conversazione (messaggi inviati da altri e non ancora segnati)
    const withUnread = await Promise.all(
      convos.map(async (c) => {
        const unreadCount = await Message.countDocuments({ conversation: c._id, sender: { $ne: userId }, readBy: { $ne: userId } });
        const obj = c.toObject();
        obj.unreadCount = unreadCount;
        return obj;
      })
    );
    res.json(withUnread);
  } catch (err) {
    console.error('listConversations error', err);
    res.status(500).json({ error: 'Errore recupero conversazioni' });
  }
}

export async function listMessages(req, res) {
  try {
    const { conversationId } = req.params;
    // Autorizzazione: utente deve far parte della conversazione
    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.participants.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('listMessages error', err);
    res.status(500).json({ error: 'Errore recupero messaggi' });
  }
}

export async function postMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Testo richiesto' });
    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.participants.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    const msg = await Message.create({ conversation: conversationId, sender: req.user.id, text: text.trim() });
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: { text: msg.text, sender: req.user.id, at: msg.createdAt } });
    res.status(201).json(msg);
  } catch (err) {
    console.error('postMessage error', err);
    res.status(500).json({ error: 'Errore invio messaggio' });
  }
}

export async function markRead(req, res) {
  try {
    const { conversationId } = req.params;
    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.participants.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    await Message.updateMany({ conversation: conversationId, readBy: { $ne: req.user.id } }, { $push: { readBy: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('markRead error', err);
    res.status(500).json({ error: 'Errore aggiornamento lettura' });
  }
}
