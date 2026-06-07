export const sendSMS = async (to, message) => {
  try {
    const gateway = process.env.SMS_GATEWAY || 'mock';
    
    // Log the message attempt to server logs
    console.log(`[SMS Send Request] Target: ${to} | Gateway: ${gateway}`);
    console.log(`[SMS Message Content]: "${message}"`);

    if (gateway === 'mock' || (gateway !== 'twilio' && !process.env.SMS_API_KEY && !process.env.SMS_GATEWAY_URL)) {
      console.log(`[SMS MOCK SUCCESS] Message successfully sent to ${to} (Mock Mode)`);
      return { success: true, mode: 'mock' };
    }

    if (gateway === 'africastalking') {
      const username = process.env.SMS_USERNAME || 'sandbox';
      const apiKey = process.env.SMS_API_KEY;
      const senderId = process.env.SMS_SENDER_ID;

      if (!apiKey) {
        throw new Error("SMS_API_KEY is not configured for Africa's Talking");
      }

      const params = new URLSearchParams();
      params.append('username', username);
      params.append('to', to);
      params.append('message', message);
      if (senderId) {
        params.append('from', senderId);
      }

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Africa's Talking returned status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[SMS AT Response]', data);
      return { success: true, data };
    }

    if (gateway === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM) are missing");
      }

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', fromNumber);
      params.append('Body', message);

      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Twilio returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log('[SMS Twilio Response]', data);
      return { success: true, data };
    }

    if (process.env.SMS_GATEWAY_URL) {
      const urlTemplate = process.env.SMS_GATEWAY_URL;
      const encodedTo = encodeURIComponent(to);
      const encodedMessage = encodeURIComponent(message);
      
      const targetUrl = urlTemplate
        .replace('{{to}}', encodedTo)
        .replace('{{message}}', encodedMessage);

      const method = (process.env.SMS_GATEWAY_METHOD || 'GET').toUpperCase();
      
      console.log(`[SMS Gateway Request] ${method} ${targetUrl}`);
      
      let response;
      if (method === 'POST') {
        const contentType = process.env.SMS_GATEWAY_CONTENT_TYPE || 'application/json';
        let bodyData = { to, message };

        if (process.env.SMS_GATEWAY_BODY_TEMPLATE) {
          try {
            const parsedBodyStr = process.env.SMS_GATEWAY_BODY_TEMPLATE
              .replace('{{to}}', to)
              .replace('{{message}}', message);
            bodyData = JSON.parse(parsedBodyStr);
          } catch (e) {
            console.warn('[SMS] Could not parse SMS_GATEWAY_BODY_TEMPLATE as JSON, using default object.');
          }
        }

        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': contentType
          },
          body: contentType === 'application/json' ? JSON.stringify(bodyData) : new URLSearchParams(bodyData)
        });
      } else {
        response = await fetch(targetUrl, { method: 'GET' });
      }

      if (!response.ok) {
        throw new Error(`SMS Gateway returned status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('[SMS Gateway Response]', responseText);
      return { success: true, response: responseText };
    }

  } catch (error) {
    // Non-blocking try/catch as per requirement
    console.error('[SMS SEND ERROR] Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
};
