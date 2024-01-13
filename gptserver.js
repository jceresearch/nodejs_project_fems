
/* Demo of interacting with GPT Chat

This demo uses the OpenAI API to interact with the GPT-3 chat model.
The key needs to be set in the .env file in the root directory.
Needs dotenv and openai packages installed:
  * npm install dotenv
  * npm install openai
  
To run:
  * node FILENAME.js
  


*/

import "dotenv/config"
import OpenAI from 'openai';
// we check that the api key is set
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set, ensure it is added to the .env file")
}
const gpt = new OpenAI()
const results = await gpt.chat.completions.create(
  {
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    messages: [
      {role: "system", content: "You are an AI assistant helping with nodejs development."},
      {role: "user", content: "Hi, what is the most popular nodejs framework?"},
    ]
  }
)

console.log(results)
console.log(results.choices[0].message.content)
