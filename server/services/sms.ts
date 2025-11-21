import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendSosAlert(
  contactName: string,
  contactPhone: string,
  userName: string,
  latitude: number,
  longitude: number,
  address?: string
): Promise<void> {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    throw new Error("Twilio credentials not configured");
  }

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const locationText = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  
  const message = `EMERGENCY ALERT!\n\n${userName} has pressed the SOS button and may be in danger!\n\nLocation: ${locationText}\n\nView on map: ${mapsLink}\n\nPlease check on them immediately!\n\n- SafeGuard Safety Alert`;

  await client.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: contactPhone,
  });
}

export async function sendBulkSosAlerts(
  contacts: Array<{ name: string; phoneNumber: string }>,
  userName: string,
  latitude: number,
  longitude: number,
  address?: string
): Promise<void> {
  const promises = contacts.map((contact) =>
    sendSosAlert(contact.name, contact.phoneNumber, userName, latitude, longitude, address)
  );
  await Promise.all(promises);
}
