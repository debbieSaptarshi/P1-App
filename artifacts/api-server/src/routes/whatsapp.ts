import { Router } from 'express';
import { HttpError } from '../lib/errors';
import {
  consumePending,
  createWhatsappFoodEvent,
  householdMembers,
  identityByWaId,
  latestPending,
  latestFoodEventForMember,
  applyFoodEventCorrection,
  savePendingWhatsapp,
  seenWhatsappMessage,
  sendWhatsapp,
  downloadWhatsappMedia,
  verifyWhatsappSignature,
} from '../lib/care';
import { parseCorrectionToken } from '@workspace/campus-food';
import { admin } from '../lib/supabase';

export const whatsappRouter = Router();

whatsappRouter.get('/', (req, res) => {
  const mode = String(req.query['hub.mode'] ?? '');
  const token = String(req.query['hub.verify_token'] ?? '');
  const challenge = String(req.query['hub.challenge'] ?? '');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) throw new HttpError(503, 'WHATSAPP_UNCONFIGURED', 'WhatsApp is not configured.');
  if (mode === 'subscribe' && token === expected) {
    res.status(200).send(challenge);
    return;
  }
  throw new HttpError(403, 'VERIFY_FAILED', 'WhatsApp verification failed.');
});

whatsappRouter.post('/', async (req, res) => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) throw new HttpError(503, 'WHATSAPP_UNCONFIGURED', 'WhatsApp is not configured.');
  const raw = (req as typeof req & { rawBody?: Buffer }).rawBody;
  if (!raw || !verifyWhatsappSignature(raw, req.header('x-hub-signature-256'), secret)) {
    throw new HttpError(401, 'INVALID_SIGNATURE', 'Could not verify this WhatsApp request.');
  }
  res.status(200).json({ ok: true });
  void handlePayload(req.body).catch((error) => {
    req.log?.error?.({ code: error?.code ?? 'WHATSAPP_HANDLE' }, 'WhatsApp handler failed');
  });
});

type WaMessage = {
  id: string;
  from: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string; mime_type?: string };
  caption?: string;
  interactive?: { type?: string; list_reply?: { id?: string; title?: string }; button_reply?: { id?: string } };
};

function contextButtons(name: string) {
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: `Logged for ${name}. Where was this meal? A photo cannot see oil or restaurant gravy.` },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'ctx:mess', title: 'Mess' } },
          { type: 'reply', reply: { id: 'ctx:home', title: 'Home' } },
          { type: 'reply', reply: { id: 'ctx:restaurant', title: 'Restaurant' } },
        ],
      },
    },
  };
}

function oilButtons() {
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: 'Any extra oil or ghee beyond the usual serving?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'oil:0', title: 'None' } },
          { type: 'reply', reply: { id: 'oil:1', title: '1 tsp' } },
          { type: 'reply', reply: { id: 'oil:2', title: '2 tsp' } },
        ],
      },
    },
  };
}

async function handlePayload(body: unknown) {
  const entries = (body as { entry?: { changes?: { value?: { messages?: WaMessage[]; statuses?: unknown[] } }[] }[] })?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (value?.statuses?.length && !value.messages?.length) continue;
      for (const message of value?.messages ?? []) {
        await handleMessage(message);
      }
    }
  }
}

async function handleMessage(message: WaMessage) {
  if (await seenWhatsappMessage(message.id)) return;
  const waId = message.from;
  const identity = await identityByWaId(waId);
  if (!identity) {
    await sendWhatsapp(waId, {
      type: 'text',
      text: { body: 'This number is not linked yet. Ask your nutritionist for an invite code, or finish setup in the app.' },
    });
    await admin().from('whatsapp_messages').upsert({ wa_message_id: message.id });
    return;
  }
  const actor = await admin().from('members').select('*').eq('id', identity.member_id).maybeSingle();
  if (!actor.data) return;

  if (message.type === 'interactive' && message.interactive?.button_reply?.id) {
    const correction = parseCorrectionToken(message.interactive.button_reply.id);
    const event = await latestFoodEventForMember(identity.member_id);
    if (!correction || !event) {
      await sendWhatsapp(waId, { type: 'text', text: { body: 'Send a meal photo first, then tell us where it was and whether there was extra oil.' } });
      await admin().from('whatsapp_messages').upsert({ wa_message_id: message.id });
      return;
    }
    await applyFoodEventCorrection(String(event.id), correction);
    await admin().from('whatsapp_messages').upsert({ wa_message_id: message.id, food_event_id: event.id });
    if (correction.context) {
      await sendWhatsapp(waId, oilButtons());
      return;
    }
    await sendWhatsapp(waId, {
      type: 'text',
      text: { body: 'Saved. A nutritionist can review the photo with that place and oil note. Calories from photos are estimates.' },
    });
    return;
  }

  if (message.type === 'interactive' && message.interactive?.list_reply?.id) {
    const pending = await latestPending(waId);
    if (!pending) {
      await sendWhatsapp(waId, { type: 'text', text: { body: 'Send a meal photo first, then choose who it was for.' } });
      await admin().from('whatsapp_messages').upsert({ wa_message_id: message.id });
      return;
    }
    const result = await createWhatsappFoodEvent({
      actorMemberId: pending.member_id,
      subjectMemberId: message.interactive.list_reply.id,
      caption: pending.caption ?? undefined,
      mediaPath: pending.media_path ?? undefined,
      mediaType: pending.media_type ?? undefined,
      waMessageId: message.id,
    });
    await consumePending(pending.id);
    await sendWhatsapp(waId, contextButtons(result.subject.display_name));
    return;
  }

  const caption = message.image?.caption ?? message.text?.body;
  const mediaId = message.image?.id;
  let mediaPath: string | undefined;
  let mediaType: string | undefined;
  if (mediaId) {
    const downloaded = await downloadWhatsappMedia(mediaId);
    mediaPath = downloaded?.path;
    mediaType = downloaded?.mediaType;
  }

  const members = await householdMembers(actor.data.household_id);
  const loggable = [];
  for (const member of members) {
    if (member.id === identity.member_id) {
      loggable.push(member);
      continue;
    }
    const { data: proxy } = await admin()
      .from('proxy_permissions')
      .select('granted')
      .eq('actor_member_id', identity.member_id)
      .eq('subject_member_id', member.id)
      .eq('granted', true)
      .maybeSingle();
    if (proxy) loggable.push(member);
  }

  if (loggable.length === 1) {
    const result = await createWhatsappFoodEvent({
      actorMemberId: identity.member_id,
      subjectMemberId: loggable[0].id,
      caption,
      mediaPath,
      mediaType,
      waMessageId: message.id,
    });
    await sendWhatsapp(waId, contextButtons(result.subject.display_name));
    return;
  }

  await savePendingWhatsapp({
    waId,
    memberId: identity.member_id,
    mediaId,
    caption,
    mediaPath,
    mediaType,
    waMessageId: message.id,
  });
  await sendWhatsapp(waId, {
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: 'Who was this meal for?' },
      action: {
        button: 'Choose',
        sections: [{
          title: 'Household',
          rows: loggable.slice(0, 10).map((m) => ({ id: m.id, title: m.display_name.slice(0, 24) })),
        }],
      },
    },
  });
}
