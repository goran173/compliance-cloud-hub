import axios from 'axios';
import { decrypt } from '../utils/encryption'; 

export const processJiraDeletion = async (email: string, integration: any) => {
  console.log("🚀 STARTING JIRA PROCESSOR (V5 - JQL Endpoint Mode)");
  
  try {
    // 1. Decrypt Credentials
    let credentials;
    try {
        const decryptedString = decrypt(integration.encryptedAccessToken);
        credentials = JSON.parse(decryptedString);
    } catch (e) {
        console.error("Credential Decryption Error:", e);
        return "Jira Error: Could not decrypt credentials.";
    }

    const { jiraDomain, jiraEmail, jiraApiToken } = credentials;
    const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
    
    // 2. Search using the NEW JQL Endpoint (The Fix)
    // The error message explicitly asked for "/rest/api/3/search/jql"
    const searchUrl = `https://${jiraDomain}/rest/api/3/search/jql`;
    
    const jql = `text ~ "${email}"`;
    console.log(`🔍 Searching via POST to JQL Endpoint: ${jql}`);
    
    const searchRes = await axios.post(searchUrl, 
      {
        jql: jql,
        fields: ["id", "key", "summary"],
        maxResults: 10
      },
      {
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const issues = searchRes.data.issues;
    if (!issues || issues.length === 0) {
        return "Jira: No tickets found containing this email.";
    }

    // 3. Flag Tickets
    let flaggedCount = 0;
    for (const issue of issues) {
      console.log(`📝 Flagging Ticket: ${issue.key}`);
      
      const commentBody = {
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `⚠️ GDPR ALERT: A deletion request was received for ${email}. Please redact PII from this ticket manually.`
                }
              ]
            }
          ]
        }
      };

      await axios.post(`https://${jiraDomain}/rest/api/3/issue/${issue.key}/comment`, 
        commentBody,
        {
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
        }
      );
      flaggedCount++;
    }

    return `Jira: Successfully flagged ${flaggedCount} tickets.`;

  } catch (error: any) {
    if (error.response) {
      console.error("❌ Jira API Error:", error.response.status, JSON.stringify(error.response.data));
      return `Jira Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    }
    console.error("❌ Jira Network Error:", error.message);
    return `Jira Error: ${error.message}`;
  }
};