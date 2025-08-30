const Message = require("../models/messageModel");
const axios = require("axios");

// Basic environment variables (one set of credentials)
const SMS_API_URL = process.env.SMS_API_URL || "https://www.smsstriker.com/API/sms.php";
const SMS_USERNAME = process.env.SMS_USERNAME;
const SMS_PASSWORD = process.env.SMS_PASSWORD;
const SMS_FROM = process.env.SMS_FROM;   // must be 6 chars
const SMS_TYPE = process.env.SMS_TYPE || 1;

// Example template map with 3 templates
const TEMPLATE_MAP = [
  {
    templateId: "1707168662769323079", 
    keywords: ["case you have not requested", "otp for your login"]
  },
  {
    templateId: "170716866273762242",
    keywords: ["your login otp is", "regards inspired grow"]
  },
  {
    templateId: "1707168680750804315",
    keywords: ["hassle-free", "book our van"]
  }
];

// Inline function to find the matching template
function findTemplateIdByMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  for (const template of TEMPLATE_MAP) {
    // Check if all keywords appear in the message (adjust to `.some()` if you prefer partial match)
    const matchedAllKeywords = template.keywords.every(
      (keyword) => lowerMsg.includes(keyword.toLowerCase())
    );
    if (matchedAllKeywords) {
      return template.templateId;
    }
  }
  // If none matched, return empty or set a fallback
  return "";
}

const sendMessage = async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    if (!phoneNumbers || !message) {
      return res.status(400).json({ error: "Phone numbers and message are required" });
    }

    // 1) Determine the template ID by scanning the message
    const templateId = findTemplateIdByMessage(message);

    // 2) Optionally store the message in MongoDB for record-keeping
    const newMessage = new Message({ phoneNumbers, message });
    await newMessage.save();

    // 3) Build the SMS API request URL
    const to = phoneNumbers.join(",");
    const encodedMsg = encodeURIComponent(message);
    
    // No longer referencing a single 'SMS_TEMPLATE_ID' from .env
    // Instead, we use the matched templateId (which might be empty if no match)
    const requestUrl = `${SMS_API_URL}?username=${SMS_USERNAME}&password=${SMS_PASSWORD}&from=${SMS_FROM}&to=${to}&msg=${encodedMsg}&type=${SMS_TYPE}&template_id=${templateId}`;

    // 4) Make the API call
    const smsResponse = await axios.get(requestUrl);
    
    // 5) Log or handle the API response
    console.log(`SMS API response: ${smsResponse.data}`);
    console.log(`Message sent to: ${to}`);
    console.log(`Message content: ${message}`);

    // 6) Send response back to the client
    res.status(201).json({ 
      message: "Message sent successfully", 
      data: newMessage, 
      templateIdUsed: templateId,
      smsApiResponse: smsResponse.data 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ sentAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessages };
