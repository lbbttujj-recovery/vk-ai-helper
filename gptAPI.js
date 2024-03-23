require('dotenv').config()
const OpenAI = require("openai/index")
const apiKey = process.env.OPENAI_KEY;
const openai = new OpenAI({
    apiKey,
});

const gptPrompt = async (value) => {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: `${value}` }],
        model: 'gpt-3.5-turbo',
    });
    return chatCompletion.choices[0].message.content
}

module.exports = gptPrompt